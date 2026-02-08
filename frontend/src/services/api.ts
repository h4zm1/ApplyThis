import axios from "axios";

// axios use import.meta.env for env variables (not process.env) and the var need to start with VITE_ to be visible by import.meta.env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/apiao";

// create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// this will run before every request (like HttpInterceptor in angular)
// request interceptor (add auth token)
// we looking at the config object (config) that tell axios how the build the upcoming http request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

// run after every response
// response interceptor (handle 401 ands refresh token)
// catch failed api call (cause token expired), swap old token for new one, and try original request
api.interceptors.response.use(
  // success, if respose is 2xx then pass it through (internal axios decision)
  (response) => response,

  // error, if respojse is error
  async (error) => {
    // save the original request so we can retry it later
    const orginalRequest = error.config;

    /*
     * check for 2 things:
     * 1: error.response.status == 401: did server say 'unauthorized'?
     * 2: originalRequest._retry == false: have we already refresh this request? (to prvent infinit loop)
     */
    if (error.response?.status == 401 && !orginalRequest._retry) {
      orginalRequest._retry = true; // mark this request so we don't refresh it 2nd time

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("no refresh token");
        }

        // call the refresh endpoint to get new access token
        // we using axios (global instance) instead of normal 'api' to avoid triggering this interceptor again in a loop
        const response = await axios.post(API_URL + "/auth/refresh", {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // save new tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // update the auth header of the failed request with the new token that we just got
        orginalRequest.headers.Authorization = "Bearer " + accessToken;

        // retry original requst by passing the updated config back to the api instance
        // this return the result of the retrieved call back to the original 'await' that triggered this
        return api(orginalRequest);
      } catch (refreshError) {
        // refresh failed (expired or invalid), so now clear token and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login"; // force redired
        return Promise.reject(refreshError);
      }
    }
    // if the error wasn't 401 or refresh failed, throw the error back to the component
    return Promise.reject(error);
  },
);

export default api;
