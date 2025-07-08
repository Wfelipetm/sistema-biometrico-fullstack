import pytest
from unittest.mock import patch, MagicMock
from flask import Flask
from app.controller.pontoController import register_ponto

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@patch('app.controller.pontoController.get_db_connection')
@patch('app.controller.pontoController.IndexSearch')
@patch('app.controller.pontoController.identify_user')
@patch('app.controller.pontoController.requests.post')
def test_entrada_sucesso(mock_requests_post, mock_identify_user, mock_IndexSearch, mock_get_db):
    # Mock biometria identificada
    mock_identify_user.return_value = b'fake_fir'
    mock_IndexSearch.UserID = 1
    mock_IndexSearch.ClearDB.return_value = None
    mock_IndexSearch.IdentifyUser.return_value = None
    mock_IndexSearch.AddFIR.return_value = None

    # Mock banco de dados
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    # AddFIR
    mock_cursor.fetchall.side_effect = [
        [(b'biometria', 1)],
    ]
    # user_data, unidade_funcionario_nome, unidade_terminal_nome, ferias_data, ultimo_ponto
    mock_cursor.fetchone.side_effect = [
        (1, "Fulano", "123.456.789-00", 5, "123", "Cargo", 1, "fulano@email.com"),
        ("Unidade Teste",),
        ("Unidade Teste",),
        None,  # ferias_data
        None,  # ultimo_ponto
    ]

    # Mock requests.post para Node.js
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.text = "OK"
    mock_response.raise_for_status.return_value = None
    mock_requests_post.return_value = mock_response

    # Mock request context
    with patch('app.controller.pontoController.request') as mock_request:
        mock_request.json = {"unidade_id": 5}
        response, status = register_ponto()
        assert status == 200
        assert "Entrada registrada com sucesso" in response.json["message"]

@patch('app.controller.pontoController.get_db_connection')
@patch('app.controller.pontoController.IndexSearch')
@patch('app.controller.pontoController.identify_user')
def test_unidade_errada(mock_identify_user, mock_IndexSearch, mock_get_db):
    mock_identify_user.return_value = b'fake_fir'
    mock_IndexSearch.UserID = 1
    mock_IndexSearch.ClearDB.return_value = None
    mock_IndexSearch.IdentifyUser.return_value = None
    mock_IndexSearch.AddFIR.return_value = None

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.side_effect = [
        [(b'biometria', 1)],
    ]
    mock_cursor.fetchone.side_effect = [
        (1, "Fulano", "123.456.789-00", 99, "123", "Cargo", 1, "fulano@email.com"),
        ("Unidade Funcionario",),
        ("Unidade Terminal",),
    ]

    with patch('app.controller.pontoController.request') as mock_request:
        mock_request.json = {"unidade_id": 5}
        response, status = register_ponto()
        assert status == 403
        assert "não pertence a esta unidade" in response.json["message"]

@patch('app.controller.pontoController.get_db_connection')
@patch('app.controller.pontoController.IndexSearch')
@patch('app.controller.pontoController.identify_user')
def test_saida_antes_5_min(mock_identify_user, mock_IndexSearch, mock_get_db):
    mock_identify_user.return_value = b'fake_fir'
    mock_IndexSearch.UserID = 1
    mock_IndexSearch.ClearDB.return_value = None
    mock_IndexSearch.IdentifyUser.return_value = None
    mock_IndexSearch.AddFIR.return_value = None

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.side_effect = [
        [(b'biometria', 1)],
    ]
    from datetime import datetime, timedelta
    agora = datetime.now()
    mock_cursor.fetchone.side_effect = [
        (1, "Fulano", "123.456.789-00", 5, "123", "Cargo", 1, "fulano@email.com"),
        ("Unidade Teste",),
        ("Unidade Teste",),
        None,  # ferias_data
        (1, agora.time(), None, agora),  # ultimo_ponto: entrada agora, sem saída
    ]

    with patch('app.controller.pontoController.request') as mock_request:
        mock_request.json = {"unidade_id": 5}
        response, status = register_ponto()
        assert status == 400
        assert "aguardar pelo menos 5 minutos" in response.json["message"]

@patch('app.controller.pontoController.get_db_connection')
@patch('app.controller.pontoController.IndexSearch')
@patch('app.controller.pontoController.identify_user')
def test_ferias(mock_identify_user, mock_IndexSearch, mock_get_db):
    mock_identify_user.return_value = b'fake_fir'
    mock_IndexSearch.UserID = 1
    mock_IndexSearch.ClearDB.return_value = None
    mock_IndexSearch.IdentifyUser.return_value = None
    mock_IndexSearch.AddFIR.return_value = None

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.side_effect = [
        [(b'biometria', 1)],
    ]
    from datetime import datetime
    mock_cursor.fetchone.side_effect = [
        (1, "Fulano", "123.456.789-00", 5, "123", "Cargo", 1, "fulano@email.com"),
        ("Unidade Teste",),
        ("Unidade Teste",),
        ("2025-07-01", "2025-07-31"),  # ferias_data
    ]

    with patch('app.controller.pontoController.request') as mock_request:
        mock_request.json = {"unidade_id": 5}
        response, status = register_ponto()
        assert status == 400
        assert "férias" in response.json["message"]

@patch('app.controller.pontoController.get_db_connection')
@patch('app.controller.pontoController.IndexSearch')
@patch('app.controller.pontoController.identify_user')
def test_nao_identificado(mock_identify_user, mock_IndexSearch, mock_get_db):
    mock_identify_user.return_value = b'fake_fir'
    mock_IndexSearch.UserID = 0  # Não identificado
    mock_IndexSearch.ClearDB.return_value = None
    mock_IndexSearch.IdentifyUser.return_value = None
    mock_IndexSearch.AddFIR.return_value = None

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.side_effect = [
        [(b'biometria', 1)],
    ]

    with patch('app.controller.pontoController.request') as mock_request:
        mock_request.json = {"unidade_id": 5}
        response, status = register_ponto()
        assert status == 401
        assert "não identificado" in response.json["message"].lower()

@patch('app.controller.pontoController.get_db_connection')
@patch('app.controller.pontoController.IndexSearch')
@patch('app.controller.pontoController.identify_user')
def test_saida_ja_bateu(mock_identify_user, mock_IndexSearch, mock_get_db):
    mock_identify_user.return_value = b'fake_fir'
    mock_IndexSearch.UserID = 1
    mock_IndexSearch.ClearDB.return_value = None
    mock_IndexSearch.IdentifyUser.return_value = None
    mock_IndexSearch.AddFIR.return_value = None

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.side_effect = [
        [(b'biometria', 1)],
    ]
    from datetime import datetime, timedelta
    agora = datetime.now()
    mock_cursor.fetchone.side_effect = [
        (1, "Fulano", "123.456.789-00", 5, "123", "Cargo", 1, "fulano@email.com"),
        ("Unidade Teste",),
        ("Unidade Teste",),
        None,  # ferias_data
        (1, agora.time(), agora.time(), agora),  # ultimo_ponto: já tem entrada e saída
    ]

    with patch('app.controller.pontoController.request') as mock_request:
        mock_request.json = {"unidade_id": 5}
        response, status = register_ponto()
        assert status == 400
        assert "já bateu seu ponto de saída" in response.json["message"]

@patch('app.controller.pontoController.get_db_connection')
@patch('app.controller.pontoController.IndexSearch')
@patch('app.controller.pontoController.identify_user')
@patch('app.controller.pontoController.requests.post')
def test_erro_nodejs(mock_requests_post, mock_identify_user, mock_IndexSearch, mock_get_db):
    mock_identify_user.return_value = b'fake_fir'
    mock_IndexSearch.UserID = 1
    mock_IndexSearch.ClearDB.return_value = None
    mock_IndexSearch.IdentifyUser.return_value = None
    mock_IndexSearch.AddFIR.return_value = None

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.side_effect = [
        [(b'biometria', 1)],
    ]
    mock_cursor.fetchone.side_effect = [
        (1, "Fulano", "123.456.789-00", 5, "123", "Cargo", 1, "fulano@email.com"),
        ("Unidade Teste",),
        ("Unidade Teste",),
        None,  # ferias_data
        None,  # ultimo_ponto
    ]

    # Simula erro no Node.js
    mock_requests_post.side_effect = Exception("Node.js offline")

    with patch('app.controller.pontoController.request') as mock_request:
        mock_request.json = {"unidade_id": 5}
        response, status = register_ponto()
        assert status == 500
        assert "Erro ao registrar ponto" in response.json["message"]