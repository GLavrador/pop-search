from unittest.mock import MagicMock, patch

import pytest

from dtos import PostInfo
from scripts import backfill_posts

PICTURE = "https://pbs.twimg.com/a.jpg"
POST = PostInfo(texto="dia de meia maluca", miniatura=PICTURE)

ROWS = [
    {"id": "video-1", "url_original": " https://x.com/a/status/1 "},
    {"id": "video-2", "url_original": "https://x.com/a/status/2"},
    {"id": "video-3", "url_original": "https://example.com/watch/3"},
    {"id": "video-4", "url_original": "https://x.com/a/status/4"},
]


@pytest.fixture
def archive():
    """Four videos without a post: one X still shows, one X no longer shows,
    one whose link was typed by hand and is not from X, and one whose post has
    words but no picture."""
    table = MagicMock()
    pending = table.select.return_value.is_.return_value.order.return_value
    pending.execute.return_value.data = ROWS
    posts = {
        "https://x.com/a/status/1": POST,
        "https://x.com/a/status/4": PostInfo(texto="so palavras"),
    }

    with patch.object(backfill_posts, "supabase") as supabase, \
         patch.object(backfill_posts, "fetch_post", side_effect=posts.get) as fetch, \
         patch.object(backfill_posts, "PAUSE_SECONDS", 0):
        supabase.table.return_value = table
        yield table, fetch


def _written(table):
    return [
        (update.args[0]["post"], update_filter.args)
        for update, update_filter in zip(table.update.call_args_list, table.update.return_value.eq.call_args_list)
    ]


def test_only_looks_at_videos_without_a_post(archive):
    table, _ = archive

    backfill_posts.backfill(write=False)

    table.select.return_value.is_.assert_called_once_with("post", "null")


def test_writes_nothing_unless_asked(archive):
    table, _ = archive

    assert backfill_posts.backfill(write=False) == 1
    table.update.assert_not_called()


def test_writes_the_picture_alone_by_default(archive):
    """The text of a post only stays with a video when someone leaves it there."""
    table, _ = archive

    assert backfill_posts.backfill(write=True) == 1

    assert _written(table) == [({"texto": "", "miniatura": PICTURE}, ("id", "video-1"))]


def test_writes_the_text_too_when_asked(archive):
    table, _ = archive

    assert backfill_posts.backfill(write=True, with_text=True) == 2

    assert _written(table) == [
        (POST.model_dump(), ("id", "video-1")),
        ({"texto": "so palavras", "miniatura": None}, ("id", "video-4")),
    ]


def test_never_fetches_a_link_that_is_not_from_x(archive):
    _, fetch = archive

    backfill_posts.backfill(write=True)

    assert [call.args[0] for call in fetch.call_args_list] == [
        "https://x.com/a/status/1",
        "https://x.com/a/status/2",
        "https://x.com/a/status/4",
    ]
