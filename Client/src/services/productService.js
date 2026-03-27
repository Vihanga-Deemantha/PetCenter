import API from "./api";

export const getProducts = async () => {
  const response = await API.get("/products");
  return response.data;
};

export const getProduct = async (id) => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};
