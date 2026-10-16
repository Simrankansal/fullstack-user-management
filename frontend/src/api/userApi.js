import axios from "axios";

const API_URL = "http://localhost:5000/api";


const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};


export const getProfile = async () => {
  const response = await axios.get(
    `${API_URL}/users/profile`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const getUsers = async () => {
  const response = await axios.get(
    `${API_URL}/users`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


export const getUserById = async (id) => {
  const response = await axios.get(
    `${API_URL}/users/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


export const updateUser = async (id, userData) => {
  const response = await axios.put(
    `${API_URL}/users/${id}`,
    userData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};


export const deleteUser = async (id) => {
  const response = await axios.delete(
    `${API_URL}/users/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};