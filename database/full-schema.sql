--
-- PostgreSQL database cluster dump
--

-- Started on 2025-05-09 11:42:24

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE biometrico;
ALTER ROLE biometrico WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Ucof3c0BntqcUzjxWRbJUw==$8ib0pdQYlPKBRa9ytmUQHcrm4EpYmtvBT7sqwKGcGj8=:7cpAMqE1OZWtEspPt80RGvvmPnvs9k9Y4rRor8iqXmc=';
CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:orK3J/aimY65o4pULAopcg==$sqd0k5K38YTmgIZu2UCcciEVdUtYR0WEPgglpPQp94g=:yq6XGstd6Aa6WpCFEfkUORV3Bx8Wqf/7JavyMXe22/4=';

--
-- User Configurations
--








--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.1

-- Started on 2025-05-09 11:42:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2025-05-09 11:42:25

--
-- PostgreSQL database dump complete
--

--
-- Database "biometrico" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.1

-- Started on 2025-05-09 11:42:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3482 (class 1262 OID 33333)
-- Name: biometrico; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE biometrico WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C.UTF-8';


ALTER DATABASE biometrico OWNER TO postgres;

\connect biometrico

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 858 (class 1247 OID 33335)
-- Name: tipo_escala_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_escala_enum AS ENUM (
    '8h',
    '12h',
    '16h',
    '24h',
    '12x36',
    '24x72',
    '32h',
    '20h'
);


ALTER TYPE public.tipo_escala_enum OWNER TO postgres;

--
-- TOC entry 227 (class 1255 OID 33351)
-- Name: calcular_horas_desconto(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_horas_desconto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    jornada_esperada INTERVAL;
    pausa_almoco INTERVAL := INTERVAL '0 minutes'; -- Padrão sem almoço
    atraso INTERVAL;
    horas_trabalhadas INTERVAL;
    saldo_faltante INTERVAL;
BEGIN
    -- Obtém a jornada esperada do funcionário com base no tipo de escala
    SELECT 
        CASE f.tipo_escala
            WHEN '8h' THEN INTERVAL '8 hours'
            WHEN '12h' THEN INTERVAL '12 hours'
            WHEN '16h' THEN INTERVAL '16 hours'
            WHEN '24h' THEN INTERVAL '24 hours'
            WHEN '12x36' THEN INTERVAL '12 hours'
            WHEN '24x72' THEN INTERVAL '24 hours'
            WHEN '32h' THEN INTERVAL '32 hours'
            WHEN '20h' THEN INTERVAL '20 hours'
            ELSE INTERVAL '8 hours'
        END
    INTO jornada_esperada
    FROM funcionarios f
    WHERE f.id = NEW.funcionario_id;

    -- Define pausa para almoço APENAS para escalas de 8h e 12h
    IF jornada_esperada = INTERVAL '8 hours' OR jornada_esperada = INTERVAL '12 hours' THEN
        pausa_almoco := INTERVAL '1 hour';
    END IF;

    -- Calcula o tempo total trabalhado
    horas_trabalhadas := (NEW.hora_saida - NEW.hora_entrada - pausa_almoco)::INTERVAL;

    -- Se trabalhou menos que a jornada esperada, calcula saldo faltante
    saldo_faltante := jornada_esperada - horas_trabalhadas;

    -- Se faltou horas, registra como desconto, senão é hora extra
    IF saldo_faltante > INTERVAL '0 minutes' THEN
        NEW.hora_desconto := saldo_faltante;
        NEW.hora_extra := INTERVAL '0 minutes';
    ELSE
        NEW.hora_desconto := INTERVAL '0 minutes';
        NEW.hora_extra := CASE 
            WHEN saldo_faltante < INTERVAL '0 minutes' THEN saldo_faltante * -1 
            ELSE saldo_faltante 
        END; -- Garante que o valor nunca seja negativo
    END IF;

    -- Horas normais são no máximo a jornada esperada
    NEW.horas_normais := LEAST(horas_trabalhadas, jornada_esperada);

    -- Total trabalhado (considerando almoço apenas se aplicável)
    NEW.total_trabalhado := horas_trabalhadas;

    -- Hora de saída ajustada é a real, sem alterações
    NEW.hora_saida_ajustada := NEW.hora_saida;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calcular_horas_desconto() OWNER TO postgres;

--
-- TOC entry 228 (class 1255 OID 33352)
-- Name: calcular_horas_normais(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_horas_normais() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se hora_entrada e hora_saida nÆo forem nulos, calcular a diferen‡a
    IF NEW.hora_entrada IS NOT NULL AND NEW.hora_saida IS NOT NULL THEN
        -- Calcular a diferen‡a entre hora_saida e hora_entrada e armazenar como time
        NEW.horas_normais := (NEW.hora_saida - NEW.hora_entrada);
    ELSE
        NEW.horas_normais := '00:00:00'::time;  -- Se um dos valores for nulo, definir como 00:00:00
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calcular_horas_normais() OWNER TO postgres;

--
-- TOC entry 229 (class 1255 OID 33353)
-- Name: convert_to_time_format(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.convert_to_time_format() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_seconds INT;
    hours INT;
    minutes INT;
    seconds INT;
    formatted_time TEXT;
BEGIN
    -- Se for UPDATE e OLD.horas_normais existir, calcular a diferen‡a
    IF TG_OP = 'UPDATE' AND OLD.horas_normais IS NOT NULL THEN
        total_seconds := EXTRACT(EPOCH FROM (NEW.horas_normais - OLD.horas_normais));

        -- Converter segundos para HH:MM:SS
        hours := total_seconds / 3600;
        minutes := (total_seconds % 3600) / 60;
        seconds := total_seconds % 60;

        -- Formatar como "HH:MM:SS"
        formatted_time := LPAD(hours::TEXT, 2, '0') || ':' || LPAD(minutes::TEXT, 2, '0') || ':' || LPAD(seconds::TEXT, 2, '0');

        -- Salvar na coluna formatada (se houver uma para isso)
        NEW.horas_normais := formatted_time;
    ELSE
        -- Se for INSERT, apenas manter o valor original
        NEW.horas_normais := '00:00:00';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.convert_to_time_format() OWNER TO postgres;

--
-- TOC entry 230 (class 1255 OID 33354)
-- Name: padronizar_cargo_maiusculo(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.padronizar_cargo_maiusculo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.cargo := UPPER(NEW.cargo);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.padronizar_cargo_maiusculo() OWNER TO postgres;

--
-- TOC entry 231 (class 1255 OID 33355)
-- Name: padronizar_nome_maiusculo(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.padronizar_nome_maiusculo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.nome := UPPER(NEW.nome);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.padronizar_nome_maiusculo() OWNER TO postgres;

--
-- TOC entry 232 (class 1255 OID 33356)
-- Name: uppercase_localizacao_unidade(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.uppercase_localizacao_unidade() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.localizacao := UPPER(NEW.localizacao);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.uppercase_localizacao_unidade() OWNER TO postgres;

--
-- TOC entry 233 (class 1255 OID 33357)
-- Name: uppercase_nome_unidade(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.uppercase_nome_unidade() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.nome := UPPER(NEW.nome);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.uppercase_nome_unidade() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 33358)
-- Name: ferias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ferias (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ferias OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 33363)
-- Name: ferias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ferias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ferias_id_seq OWNER TO postgres;

--
-- TOC entry 3483 (class 0 OID 0)
-- Dependencies: 216
-- Name: ferias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ferias_id_seq OWNED BY public.ferias.id;


--
-- TOC entry 217 (class 1259 OID 33364)
-- Name: funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.funcionarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionarios_id_seq OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 33365)
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionarios (
    id integer DEFAULT nextval('public.funcionarios_id_seq'::regclass) NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    cargo character varying(255) NOT NULL,
    data_admissao date NOT NULL,
    id_biometrico text NOT NULL,
    unidade_id integer NOT NULL,
    matricula integer NOT NULL,
    tipo_escala public.tipo_escala_enum NOT NULL,
    telefone character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255)
);


ALTER TABLE public.funcionarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 33373)
-- Name: registros_ponto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registros_ponto (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    unidade_id integer NOT NULL,
    data_hora timestamp without time zone NOT NULL,
    hora_entrada time without time zone,
    hora_saida time without time zone,
    id_biometrico character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    horas_normais time without time zone,
    hora_extra time without time zone,
    hora_desconto time without time zone,
    total_trabalhado time without time zone,
    hora_saida_ajustada time without time zone
);


ALTER TABLE public.registros_ponto OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 33380)
-- Name: registros_ponto_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registros_ponto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registros_ponto_id_seq OWNER TO postgres;

--
-- TOC entry 3484 (class 0 OID 0)
-- Dependencies: 220
-- Name: registros_ponto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registros_ponto_id_seq OWNED BY public.registros_ponto.id;


--
-- TOC entry 221 (class 1259 OID 33381)
-- Name: secretarias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.secretarias (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    sigla character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.secretarias OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 33386)
-- Name: secretarias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.secretarias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.secretarias_id_seq OWNER TO postgres;

--
-- TOC entry 3485 (class 0 OID 0)
-- Dependencies: 222
-- Name: secretarias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.secretarias_id_seq OWNED BY public.secretarias.id;


--
-- TOC entry 223 (class 1259 OID 33387)
-- Name: unidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unidades (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    localizacao character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    foto character varying(255),
    secretaria_id integer
);


ALTER TABLE public.unidades OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 33394)
-- Name: unidades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unidades_id_seq OWNER TO postgres;

--
-- TOC entry 3486 (class 0 OID 0)
-- Dependencies: 224
-- Name: unidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unidades_id_seq OWNED BY public.unidades.id;


--
-- TOC entry 225 (class 1259 OID 33395)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    papel character varying(50) NOT NULL,
    CONSTRAINT usuarios_papel_check CHECK (((papel)::text = ANY (ARRAY[('admin'::character varying)::text, ('gestor'::character varying)::text])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 33401)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 3487 (class 0 OID 0)
-- Dependencies: 226
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 3284 (class 2604 OID 33402)
-- Name: ferias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ferias ALTER COLUMN id SET DEFAULT nextval('public.ferias_id_seq'::regclass);


--
-- TOC entry 3290 (class 2604 OID 33403)
-- Name: registros_ponto id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registros_ponto ALTER COLUMN id SET DEFAULT nextval('public.registros_ponto_id_seq'::regclass);


--
-- TOC entry 3293 (class 2604 OID 33404)
-- Name: secretarias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretarias ALTER COLUMN id SET DEFAULT nextval('public.secretarias_id_seq'::regclass);


--
-- TOC entry 3296 (class 2604 OID 33405)
-- Name: unidades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades ALTER COLUMN id SET DEFAULT nextval('public.unidades_id_seq'::regclass);


--
-- TOC entry 3299 (class 2604 OID 33406)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 3302 (class 2606 OID 33408)
-- Name: ferias ferias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ferias
    ADD CONSTRAINT ferias_pkey PRIMARY KEY (id);


--
-- TOC entry 3304 (class 2606 OID 33410)
-- Name: funcionarios funcionarios_new_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_new_cpf_key UNIQUE (cpf);


--
-- TOC entry 3306 (class 2606 OID 33412)
-- Name: funcionarios funcionarios_new_id_biometrico_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_new_id_biometrico_key UNIQUE (id_biometrico);


--
-- TOC entry 3308 (class 2606 OID 33414)
-- Name: funcionarios funcionarios_new_matricula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_new_matricula_key UNIQUE (matricula);


--
-- TOC entry 3310 (class 2606 OID 33416)
-- Name: funcionarios funcionarios_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_new_pkey PRIMARY KEY (id);


--
-- TOC entry 3313 (class 2606 OID 33418)
-- Name: registros_ponto registros_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_pkey PRIMARY KEY (id);


--
-- TOC entry 3315 (class 2606 OID 33420)
-- Name: secretarias secretarias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secretarias
    ADD CONSTRAINT secretarias_pkey PRIMARY KEY (id);


--
-- TOC entry 3317 (class 2606 OID 33422)
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- TOC entry 3319 (class 2606 OID 33424)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 3321 (class 2606 OID 33426)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3311 (class 1259 OID 33427)
-- Name: idx_registros_ponto_funcionario_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_registros_ponto_funcionario_data ON public.registros_ponto USING btree (funcionario_id, data_hora);


--
-- TOC entry 3327 (class 2620 OID 33428)
-- Name: funcionarios trg_cargo_maiusculo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cargo_maiusculo BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.padronizar_cargo_maiusculo();


--
-- TOC entry 3328 (class 2620 OID 33429)
-- Name: funcionarios trg_nome_maiusculo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_nome_maiusculo BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.padronizar_nome_maiusculo();


--
-- TOC entry 3329 (class 2620 OID 33430)
-- Name: registros_ponto trigger_calcular_horas_desconto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calcular_horas_desconto BEFORE INSERT OR UPDATE ON public.registros_ponto FOR EACH ROW EXECUTE FUNCTION public.calcular_horas_desconto();


--
-- TOC entry 3330 (class 2620 OID 33431)
-- Name: registros_ponto trigger_calcular_horas_normais; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calcular_horas_normais BEFORE INSERT OR UPDATE ON public.registros_ponto FOR EACH ROW EXECUTE FUNCTION public.calcular_horas_normais();


--
-- TOC entry 3331 (class 2620 OID 33432)
-- Name: registros_ponto trigger_name; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_name AFTER INSERT OR UPDATE ON public.registros_ponto FOR EACH ROW EXECUTE FUNCTION public.convert_to_time_format();


--
-- TOC entry 3332 (class 2620 OID 33433)
-- Name: unidades trigger_uppercase_localizacao_unidade; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_uppercase_localizacao_unidade BEFORE INSERT OR UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.uppercase_localizacao_unidade();


--
-- TOC entry 3333 (class 2620 OID 33434)
-- Name: unidades trigger_uppercase_nome_unidade; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_uppercase_nome_unidade BEFORE INSERT OR UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.uppercase_nome_unidade();


--
-- TOC entry 3322 (class 2606 OID 33435)
-- Name: ferias ferias_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ferias
    ADD CONSTRAINT ferias_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- TOC entry 3323 (class 2606 OID 33440)
-- Name: funcionarios funcionarios_new_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_new_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades(id) ON DELETE CASCADE;


--
-- TOC entry 3324 (class 2606 OID 33445)
-- Name: registros_ponto registros_ponto_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- TOC entry 3325 (class 2606 OID 33450)
-- Name: registros_ponto registros_ponto_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades(id) ON DELETE CASCADE;


--
-- TOC entry 3326 (class 2606 OID 33455)
-- Name: unidades unidades_secretaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_secretaria_id_fkey FOREIGN KEY (secretaria_id) REFERENCES public.secretarias(id) ON DELETE SET NULL;


-- Completed on 2025-05-09 11:42:25

--
-- PostgreSQL database dump complete
--

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.1

-- Started on 2025-05-09 11:42:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2025-05-09 11:42:26

--
-- PostgreSQL database dump complete
--

-- Completed on 2025-05-09 11:42:26

--
-- PostgreSQL database cluster dump complete
--

