const registroPontoController = require('../controllers/registroPontoController');
const db = require('../config/db');

jest.mock('../config/db');

describe('calcularERegistrarPonto', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    it('registra ENTRADA se não enviar hora_saida', async () => {
        req.body = {
            funcionario_id: 1,
            unidade_id: 1,
            data: '2025-06-19',
            hora_entrada: '08:00:00',
            id_biometrico: 'abc'
        };

        // Mock escala do funcionário
        db.query
            .mockResolvedValueOnce({ rows: [{ tipo_escala: '24x72' }] }) // escalaResult
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // INSERT

        await registroPontoController.calcularERegistrarPonto(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('registra SAÍDA se houver registro aberto', async () => {
        req.body = {
            funcionario_id: 1,
            unidade_id: 1,
            data: '2025-06-19',
            hora_entrada: '08:00:00',
            hora_saida: '08:00:00',
            id_biometrico: 'abc'
        };

        // Mock escala do funcionário
        db.query
            .mockResolvedValueOnce({ rows: [{ tipo_escala: '24x72' }] }) // escalaResult
            .mockResolvedValueOnce({ // registroResult
                rowCount: 1,
                rows: [{
                    id: 1,
                    data_hora: '2025-06-18T08:00:00',
                    hora_entrada: '08:00:00',
                    hora_saida: null
                }]
            })
            .mockResolvedValueOnce({ // UPDATE
                rows: [{
                    id: 1,
                    hora_saida: '08:00:00'
                }]
            });

        await registroPontoController.calcularERegistrarPonto(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('retorna erro ao tentar bater saída sem entrada', async () => {
        req.body = {
            funcionario_id: 1,
            unidade_id: 1,
            data: '2025-06-19',
            hora_entrada: '08:00:00',
            hora_saida: '08:00:00',
            id_biometrico: 'abc'
        };

        // Mock escala do funcionário
        db.query
            .mockResolvedValueOnce({ rows: [{ tipo_escala: '24x72' }] }) // escalaResult
            .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // registroResult

        await registroPontoController.calcularERegistrarPonto(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
});