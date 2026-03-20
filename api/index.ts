import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://localhost:1503/api",
  headers: {
    "Content-Type": "application/json",
  },
})

export default apiClient
