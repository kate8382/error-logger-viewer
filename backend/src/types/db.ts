import type { ErrorDTO } from 'errors';
import type { ProjectDTO } from 'projects';

// Данные интерфейсы должны быть отдельно от DTO, т.к. они могут включать дополнительные поля, которые не должны быть переданы клиенту, например, для внутреннего использования в базе данных или для оптимизации запросов.
// интерфейс для записи об ошибке в базе данных (может включать дополнительные поля, например, для внутреннего использования)
export interface ErrorRecord extends ErrorDTO {
  // backend internal fields (if any)
  persistedAt?: string;
}

// интерфейс для схемы базы данных, включающей коллекции ошибок и проектов
export interface DBSchema {
  errors: ErrorRecord[];
  projects: ProjectDTO[];
}

export default DBSchema;
