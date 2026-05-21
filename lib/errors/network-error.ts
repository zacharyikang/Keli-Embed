import { AppError } from "./app-error";

export class NetworkError extends AppError {
  constructor(message = "网络异常，请重试") {
    super(message, "NETWORK_ERROR");
  }
}
