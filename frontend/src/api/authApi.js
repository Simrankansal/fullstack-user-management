import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const signupUser = async (userData) => {
  const response = await axios.post(
    `${API_URL}/auth/signup`,
    userData
  );

  return response.data;
};


export const loginUser = async (userData) => {
  const response = await axios.post(
    `${API_URL}/auth/login`,
    userData
  );

  return response.data;
};