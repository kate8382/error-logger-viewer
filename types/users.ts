// создаем интерфейс для пользователя
export interface UserDTO {
  id?: string;
  username: string;
  email: string;
  projectName?: string;
}

// интерфейс для запроса на регистрацию
export interface RegisterRequest {
  username: string;
  email: string;
  projectName?: string;
}
