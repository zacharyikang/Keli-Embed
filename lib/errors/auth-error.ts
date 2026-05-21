import { AppError } from "./app-error";

export class AuthError extends AppError {
  constructor(message = "登录已过期") {
    super(message, "AUTH_ERROR");
  }
}
