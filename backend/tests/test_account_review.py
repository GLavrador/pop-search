from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app
from services import review, usage
from services.usage import Quota
from tests.conftest import DOWNLOADED, TEST_USER_ID, analyze

client = TestClient(app)

URL = "https://x.com/alguem/status/2085904884084478151"
OTHER_USER_ID = "00000000-0000-4000-8000-000000000002"
RESETS = "2026-11-01T00:00:00+00:00"

UNDER_REVIEW = Quota(used=0, limit=2, resets_at=RESETS, approved=False)
UNDER_REVIEW_WITH_VIDEO = Quota(used=1, limit=2, resets_at=RESETS, approved=False, has_video=True)

METADATA = {
    "titulo_sugerido": "Um titulo valido",
    "descricao_completa": "Uma descricao suficientemente longa para validar",
    "url_original": URL,
    "metadados_estruturados": {},
}

ANALYSIS = {
    "titulo_sugerido": "Um titulo valido",
    "descricao_completa": "Uma descricao suficientemente longa para validar",
    "metadados_estruturados": {},
}


def standing(quota: Quota):
    return patch("routers.videos.get_quota", new=AsyncMock(return_value=quota))


def _saving_database():
    database = MagicMock()
    database.table.return_value.insert.return_value.execute.return_value = (
        ("data", [{"id": "video-1"}]),
        ("count", None),
    )
    return database


class TestAnalysisUnderReview:

    @patch("routers.videos.download_video")
    def test_refuses_an_account_that_already_has_its_video(self, mock_download):
        with standing(UNDER_REVIEW_WITH_VIDEO):
            response = client.post("/videos/analyze", json={"url": URL})

        assert response.status_code == 403
        assert "waiting for approval" in response.json()["detail"]
        mock_download.assert_not_called()

    @patch("routers.videos.download_video")
    def test_refuses_once_its_try_and_retry_are_spent(self, mock_download):
        spent = Quota(used=2, limit=2, resets_at=RESETS, approved=False)

        with standing(spent):
            response = client.post("/videos/analyze", json={"url": URL})

        assert response.status_code == 429
        assert "by hand" in response.json()["detail"]
        assert "renews" not in response.json()["detail"]
        mock_download.assert_not_called()

    @patch("routers.videos.download_video")
    def test_refuses_once_the_accounts_under_review_used_their_share_of_the_day(self, mock_download):
        with standing(UNDER_REVIEW), \
             patch("routers.videos.get_pending_analyses_today",
                   new=AsyncMock(return_value=usage.PENDING_DAILY_ANALYSIS_LIMIT)):
            response = client.post("/videos/analyze", json={"url": URL})

        assert response.status_code == 503
        assert "Nothing was taken" in response.json()["detail"]
        mock_download.assert_not_called()

    def test_an_approved_account_does_not_draw_from_that_share(self):
        pool = AsyncMock(return_value=10_000)

        with patch("routers.videos.get_pending_analyses_today", new=pool), \
             patch("routers.videos.download_video", side_effect=Exception("offline")):
            client.post("/videos/analyze", json={"url": URL})

        pool.assert_not_awaited()

    @patch("routers.videos.analyze_video_content")
    @patch("routers.videos.download_video")
    def test_marks_what_it_spends_as_spent_under_review(self, mock_download, mock_analyze):
        mock_download.return_value = DOWNLOADED
        mock_analyze.return_value = dict(ANALYSIS)
        recorder = AsyncMock()

        with standing(UNDER_REVIEW), \
             patch("routers.videos.get_pending_analyses_today", new=AsyncMock(return_value=0)), \
             patch("routers.videos.record_event", new=recorder):
            outcome = analyze(client, {"url": URL})

        assert outcome.status_code == 200
        assert recorder.await_args.kwargs == {"while_pending": True}


class TestSavingUnderReview:

    @patch("routers.videos.create_embedding")
    def test_keeps_the_first_video_out_of_sight(self, mock_embedding):
        mock_embedding.return_value = [0.1] * 768
        database = _saving_database()

        with standing(UNDER_REVIEW), patch("routers.videos.supabase", database):
            response = client.post("/videos", json=METADATA)

        assert response.status_code == 200
        assert response.json()["approved"] is False
        saved = database.table.return_value.insert.call_args.args[0]
        assert saved["approved"] is False

    @patch("routers.videos.create_embedding")
    def test_refuses_a_second_video(self, mock_embedding):
        database = _saving_database()

        with standing(UNDER_REVIEW_WITH_VIDEO), patch("routers.videos.supabase", database):
            response = client.post("/videos", json=METADATA)

        assert response.status_code == 403
        assert "waiting for approval" in response.json()["detail"]
        mock_embedding.assert_not_called()
        database.table.return_value.insert.assert_not_called()

    @patch("routers.videos.create_embedding")
    def test_refuses_the_second_of_two_saves_that_raced(self, mock_embedding):
        """Both passed the check before either was written; the index keeps one."""
        mock_embedding.return_value = [0.1] * 768
        database = MagicMock()
        database.table.return_value.insert.return_value.execute.side_effect = Exception(
            'duplicate key value violates unique constraint "videos_one_pending_per_user"'
        )

        with standing(UNDER_REVIEW), patch("routers.videos.supabase", database):
            response = client.post("/videos", json=METADATA)

        assert response.status_code == 403

    @patch("routers.videos.create_embedding")
    def test_an_approved_account_saves_in_plain_sight(self, mock_embedding):
        mock_embedding.return_value = [0.1] * 768
        database = _saving_database()

        with patch("routers.videos.supabase", database):
            response = client.post("/videos", json=METADATA)

        assert response.json()["approved"] is True
        assert database.table.return_value.insert.call_args.args[0]["approved"] is True

    @patch("routers.videos.create_embedding")
    def test_an_approved_account_saves_so_many_videos_a_day(self, mock_embedding):
        busy = Quota(used=0, limit=20, resets_at=RESETS, saves_today=usage.DAILY_SAVE_LIMIT)
        database = _saving_database()

        with standing(busy), patch("routers.videos.supabase", database):
            response = client.post("/videos", json=METADATA)

        assert response.status_code == 429
        assert "Try again tomorrow" in response.json()["detail"]
        mock_embedding.assert_not_called()


class TestCopiesOfAVideoUnderReview:

    def _archived(self, owner):
        return {
            "id": "video-1",
            "titulo_video": "Something only its owner should read",
            "url_original": URL,
            "created_at": "2026-10-17T12:00:00+00:00",
            "approved": False,
            "user_id": owner,
        }

    @pytest.mark.parametrize("route, body", [
        ("/videos/analyze", {"url": URL}),
        ("/videos", METADATA),
    ])
    def test_tells_someone_else_it_is_taken_and_nothing_more(self, route, body):
        with patch("routers.videos.find_existing",
                   new=AsyncMock(return_value=self._archived(OTHER_USER_ID))):
            response = client.post(route, json=body)

        assert response.status_code == 409
        assert "existing" not in response.json()
        assert "Something only its owner" not in response.text

    def test_shows_the_owner_their_own_video(self):
        with patch("routers.videos.find_existing",
                   new=AsyncMock(return_value=self._archived(TEST_USER_ID))):
            response = client.post("/videos/analyze", json={"url": URL})

        assert response.status_code == 409
        assert response.json()["existing"]["titulo_video"] == "Something only its owner should read"


class TestStanding:

    def test_says_the_account_is_under_review_and_cannot_add(self):
        with patch("routers.me.get_quota", new=AsyncMock(return_value=UNDER_REVIEW_WITH_VIDEO)):
            body = client.get("/me/quota").json()

        assert body["approved"] is False
        assert body["can_add"] is False

    def test_lists_the_videos_with_whether_they_were_approved(self):
        database = MagicMock()
        listed = database.table.return_value.select
        listed.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = [
            {"id": "v", "url_original": URL, "created_at": "2026-10-17T12:00:00+00:00", "approved": False},
        ]

        with patch("routers.me.supabase", database):
            body = client.get("/me/videos").json()

        assert "approved" in listed.call_args.args[0]
        assert body[0]["approved"] is False


PENDING = [
    {
        "user_id": OTHER_USER_ID,
        "display_name": "Bia",
        "created_at": "2026-10-17T12:00:00+00:00",
        "video": {
            "id": "video-1",
            "titulo_video": "Um gato",
            "descricao_completa": "Um gato pulando",
            "url_original": URL,
            "created_at": "2026-10-17T12:30:00+00:00",
            "post": None,
        },
    },
]


def admin():
    return patch("routers.me.is_admin", new=AsyncMock(return_value=True))


class TestApproval:

    @pytest.mark.parametrize("method, path", [
        ("get", "/me/admin/pending"),
        ("post", f"/me/admin/pending/{OTHER_USER_ID}/approve"),
        ("delete", f"/me/admin/pending/{OTHER_USER_ID}/video"),
    ])
    def test_is_out_of_reach_of_anyone_but_the_administrator(self, method, path):
        approve = AsyncMock(return_value=True)
        remove = AsyncMock(return_value=True)

        with patch("routers.me.review.approve", new=approve), \
             patch("routers.me.review.remove_pending_video", new=remove):
            response = getattr(client, method)(path)

        assert response.status_code == 404
        approve.assert_not_awaited()
        remove.assert_not_awaited()

    def test_lists_the_accounts_under_review_with_their_video(self):
        with admin(), patch("routers.me.review.list_pending", new=AsyncMock(return_value=PENDING)):
            body = client.get("/me/admin/pending").json()

        assert body[0]["display_name"] == "Bia"
        assert body[0]["video"]["titulo_video"] == "Um gato"

    def test_approves_an_account(self):
        approve = AsyncMock(return_value=True)

        with admin(), patch("routers.me.review.approve", new=approve):
            response = client.post(f"/me/admin/pending/{OTHER_USER_ID}/approve")

        assert response.status_code == 204
        approve.assert_awaited_once_with(OTHER_USER_ID)

    def test_says_so_when_the_account_was_not_under_review(self):
        with admin(), patch("routers.me.review.approve", new=AsyncMock(return_value=False)):
            response = client.post(f"/me/admin/pending/{OTHER_USER_ID}/approve")

        assert response.status_code == 404

    def test_removes_the_video_an_account_is_waiting_on(self):
        remove = AsyncMock(return_value=True)

        with admin(), patch("routers.me.review.remove_pending_video", new=remove):
            response = client.delete(f"/me/admin/pending/{OTHER_USER_ID}/video")

        assert response.status_code == 204
        remove.assert_awaited_once_with(OTHER_USER_ID)

    def test_refuses_a_link_that_is_not_an_account(self):
        with admin():
            assert client.post("/me/admin/pending/nobody/approve").status_code == 422


class TestReviewService:

    def test_approves_through_one_transaction_in_the_database(self):
        database = MagicMock()
        database.rpc.return_value.execute.return_value.data = True

        with patch("services.review.supabase", database):
            assert review._approve(OTHER_USER_ID) is True

        database.rpc.assert_called_once_with("approve_account", {"p_user_id": OTHER_USER_ID})

    def test_only_ever_deletes_a_video_still_under_review(self):
        database = MagicMock()
        deleting = database.table.return_value.delete.return_value
        deleting.eq.return_value.eq.return_value.execute.return_value.data = [{"id": "v"}]

        with patch("services.review.supabase", database):
            assert review._remove_pending_video(OTHER_USER_ID) is True

        deleting.eq.assert_called_once_with("user_id", OTHER_USER_ID)
        deleting.eq.return_value.eq.assert_called_once_with("approved", False)

    def test_puts_the_accounts_with_a_video_first(self):
        database = MagicMock()
        profiles = database.table.return_value.select.return_value.eq.return_value
        profiles.order.return_value.limit.return_value.execute.return_value.data = [
            {"id": "new", "display_name": "Nova", "created_at": "2026-10-17T13:00:00+00:00"},
            {"id": "old", "display_name": "Antiga", "created_at": "2026-10-16T13:00:00+00:00"},
        ]
        profiles.in_.return_value.execute.return_value.data = [
            {"id": "v", "user_id": "old", "url_original": URL, "created_at": "2026-10-16T14:00:00+00:00"},
        ]

        with patch("services.review.supabase", database):
            accounts = review._fetch_pending()

        assert [account["user_id"] for account in accounts] == ["old", "new"]
        assert accounts[1]["video"] is None
