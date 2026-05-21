import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  constructor(resource = "资源") {
    super(`${resource}不存在`, "NOT_FOUND");
  }
}
