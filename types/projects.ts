// создаем интерфейс для проекта
export interface ProjectDTO {
  id: string;
  name: string;
  owner: string;
  members?: string[];
  apiKey?: string;
  snippet?: string;
  firstSeen?: string;
}

// интерфейс для запроса на создание проекта
export interface CreateProjectRequest {
  name: string;
  owner: string;
  members?: string[];
}
