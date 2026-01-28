import { Request } from "express";

// JWT content
export interface TokenPayload {
  userId: string;
  email: string;
}

/*
 NOTE: in spring a filter intercept the request, validate token and put the user in securitycontextholder
 here in express the middleware intercepts the request, validate the token and attach the payload (user) to that specific req
*/
// express request with user attached (after auth middleware verify token)
export interface AuthRequest extends Request {
  user?: TokenPayload;
}
