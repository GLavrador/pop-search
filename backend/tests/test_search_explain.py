from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

RRF_K = 50

# A ranks first by meaning only, C matches words only, and B is mid table in
# both branches. B is what RRF is for: it wins without leading either list.
SEMANTIC_ROWS = [
    {"id": "A", "titulo_video": "Gato laranja dormindo", "similarity": 0.91, "text_rank": 0.0, "score": 0.0},
    {"id": "B", "titulo_video": "Banda tocando ao vivo", "similarity": 0.72, "text_rank": 0.0, "score": 0.0},
]

TEXT_ROWS = [
    {"id": "B", "titulo_video": "Banda tocando ao vivo", "similarity": 0.0, "text_rank": 1.4, "score": 0.0},
    {"id": "C", "titulo_video": "Show da banda", "similarity": 0.0, "text_rank": 0.9, "score": 0.0},
]

FUSED_ROWS = [
    {
        "id": "B", "titulo_video": "Banda tocando ao vivo", "url_original": "http://x.com/b",
        "similarity": 0.72, "text_rank": 1.4,
        "score": 1 / (RRF_K + 2) + 1 / (RRF_K + 1),
    },
    {
        "id": "A", "titulo_video": "Gato laranja dormindo", "url_original": "http://x.com/a",
        "similarity": 0.91, "text_rank": 0.0,
        "score": 1 / (RRF_K + 1),
    },
    {
        "id": "C", "titulo_video": "Show da banda", "url_original": "http://x.com/c",
        "similarity": 0.0, "text_rank": 0.9,
        "score": 1 / (RRF_K + 2),
    },
]


def _branches(mock_supabase, semantic=None, text=None, fused=None):
    def response(rows):
        mock_response = MagicMock()
        mock_response.data = rows
        return mock_response

    mock_supabase.rpc.return_value.execute.side_effect = [
        response(SEMANTIC_ROWS if semantic is None else semantic),
        response(TEXT_ROWS if text is None else text),
        response(FUSED_ROWS if fused is None else fused),
    ]


def _explain(payload=None):
    return client.post("/search/explain", json=payload or {"query": "banda", "limit": 5, "threshold": 0.6})


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_returns_both_branches_and_the_fusion(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase)

    response = _explain()

    assert response.status_code == 200
    body = response.json()
    assert [entry["position"] for entry in body["semantic"]] == [1, 2]
    assert [entry["id"] for entry in body["semantic"]] == ["A", "B"]
    assert [entry["id"] for entry in body["text"]] == ["B", "C"]
    assert [row["id"] for row in body["fused"]] == ["B", "A", "C"]
    assert body["rrf_k"] == RRF_K


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_embeds_the_query_once_for_all_three_calls(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase)

    _explain()

    assert mock_embed.call_count == 1
    assert mock_supabase.rpc.call_count == 3


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_contributions_add_up_to_the_score(mock_embed, mock_supabase):
    """The whole point of the panel: the two numbers shown must reconstruct the
    score the database ordered by. If they drift, the explanation is a lie."""
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase)

    body = _explain().json()

    for row in body["fused"]:
        total = row["semantic_contribution"] + row["text_contribution"]
        assert total == round(row["score"], 12) or abs(total - row["score"]) < 1e-12


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_marks_which_branch_each_result_came_from(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase)

    rows = {row["id"]: row for row in _explain().json()["fused"]}

    assert rows["B"]["semantic_position"] == 2 and rows["B"]["text_position"] == 1

    assert rows["A"]["semantic_position"] == 1
    assert rows["A"]["text_position"] is None
    assert rows["A"]["text_contribution"] == 0.0

    assert rows["C"]["text_position"] == 2
    assert rows["C"]["semantic_position"] is None
    assert rows["C"]["semantic_contribution"] == 0.0


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_branch_ranks_are_read_without_the_threshold(mock_embed, mock_supabase):
    """The threshold filters the vector branch without reordering it. Applying
    it here would renumber the ranks RRF actually used."""
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase)

    _explain({"query": "banda", "limit": 5, "threshold": 0.9})

    semantic_params = mock_supabase.rpc.call_args_list[0][0][1]
    text_params = mock_supabase.rpc.call_args_list[1][0][1]
    fused_params = mock_supabase.rpc.call_args_list[2][0][1]

    assert semantic_params["match_threshold"] == 0.0
    assert semantic_params["search_mode"] == "semantic"
    assert text_params["search_mode"] == "text"
    assert fused_params["match_threshold"] == 0.9
    assert fused_params["search_mode"] == "hybrid"


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_semantic_mode_does_not_credit_the_lexical_branch(mock_embed, mock_supabase):
    """In semantic mode only the vector branch feeds the score. Showing a text
    rank next to it would print a sum that does not reach the total."""
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase, fused=[
        {
            "id": "B", "titulo_video": "Banda tocando ao vivo", "url_original": "http://x.com/b",
            "similarity": 0.72, "text_rank": 0.0, "score": 1 / (RRF_K + 2),
        }
    ])

    body = _explain({"query": "banda", "limit": 5, "threshold": 0.6, "mode": "semantic"}).json()
    row = body["fused"][0]

    assert row["semantic_position"] == 2
    assert row["text_position"] is None
    assert row["text_contribution"] == 0.0
    assert abs(row["semantic_contribution"] - row["score"]) < 1e-12

    # The lexical ranking is still reported, so the panel can show what the
    # other branch would have found.
    assert [entry["id"] for entry in body["text"]] == ["B", "C"]


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_text_mode_does_not_credit_the_vector_branch(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase, fused=[
        {
            "id": "B", "titulo_video": "Banda tocando ao vivo", "url_original": "http://x.com/b",
            "similarity": 0.0, "text_rank": 1.4, "score": 1 / (RRF_K + 1),
        }
    ])

    row = _explain({"query": "banda", "limit": 5, "threshold": 0.6, "mode": "text"}).json()["fused"][0]

    assert row["text_position"] == 1
    assert row["semantic_position"] is None
    assert row["semantic_contribution"] == 0.0
    assert abs(row["text_contribution"] - row["score"]) < 1e-12


@patch("routers.search.supabase")
@patch("routers.search.embed_query")
def test_survives_a_query_that_matches_no_words(mock_embed, mock_supabase):
    mock_embed.return_value = [0.1] * 768
    _branches(mock_supabase, text=[], fused=[FUSED_ROWS[1]])

    body = _explain().json()

    assert body["text"] == []
    assert body["fused"][0]["text_position"] is None
    assert body["fused"][0]["semantic_position"] == 1
