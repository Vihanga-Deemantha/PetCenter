import API from "./api";

export const getPets = async (params) => {
  const response = await API.get("/pets", { params });
  return response.data;
};

export const getPet = async (id) => {
  const response = await API.get(`/pets/${id}`);
  return response.data;
};

export const createPet = async (petData) => {
  const response = await API.post("/pets", petData);
  return response.data;
};

export const updatePet = async (id, petData) => {
  const response = await API.put(`/pets/${id}`, petData);
  return response.data;
};

export const deletePet = async (id) => {
  const response = await API.delete(`/pets/${id}`);
  return response.data;
};

export const getMyPets = async () => {
  const response = await API.get("/pets/my/listings");
  return response.data;
};
