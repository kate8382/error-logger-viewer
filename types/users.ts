// создаем интерфейс для пользователя
export interface UserDTO {
  id?: string;
  // NOTE: 'name' is the field actually stored by the server; 'username' kept optional
  // for backward-compatibility with any callers that use it.
  name?: string;
  username?: string;
  email: string;
  projectName?: string;
  // Timestamp set by the server when the user record is first created.
  createdAt?: string;
}

// интерфейс для запроса на регистрацию
export interface RegisterRequest {
  // Either 'name' or 'username' is accepted; prefer 'name' to match stored format.
  name?: string;
  username?: string;
  email: string;
  projectName?: string;
}
