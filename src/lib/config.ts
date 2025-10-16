export const API_BASE_URL = "https://pabnabazar.live/api/";

export const authHeader = {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
};
