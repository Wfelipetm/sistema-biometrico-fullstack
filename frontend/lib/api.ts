import axios from "axios"
const API_URL = process.env.NEXT_PUBLIC_API_URL;





export const api = axios.create({
  baseURL: `${API_URL}`,
  // Configuração para suprimir logs automáticos de erro no console
  transformResponse: [function (data) {
    try {
      return JSON.parse(data)
    } catch (error) {
      return data
    }
  }],
})

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suprimir logs automáticos do Axios para erros 404 (são esperados)
    if (error.response?.status === 404) {
      // Criar erro customizado sem propriedades que causam logs verbosos
      const cleanError = {
        message: error.message,
        name: error.name,
        response: {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        },
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      }
      return Promise.reject(cleanError)
    }

    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)
