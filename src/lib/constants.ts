import { AccessLevel, ProjectPersonRole, ShiftRole, UserStatus } from "@prisma/client";

export const DAY_TYPES = [
  "Выходной",
  "Смена",
  "Павильон",
  "Погрузка",
  "Разгрузка",
  "Смена (+ погрузка)",
  "Смена (+ разгрузка)",
  "Смена (+ перегрузка)",
  "Переезд",
  "Склад",
  "Предварительно"
];

export const shiftRoleLabels: Record<ShiftRole, string> = {
  FOCUS_PULLER: "Механик-фокуспуллер",
  PLAYBACK: "Плейбекер",
  ASSISTANT: "Ассистент",
  GAFFER: "Гаффер",
  LIGHTING_TECHNICIAN: "Осветитель"
};

export const projectPersonRoleLabels: Record<ProjectPersonRole, string> = {
  DP: "Оператор-постановщик",
  SECOND_CAMERA_OPERATOR: "Второй оператор",
  DIRECTOR: "Режиссёр-постановщик",
  SECOND_AD: "Второй режиссёр"
};

export const accessLevelLabels: Record<AccessLevel, string> = {
  OWNER: "Владелец",
  ADMIN: "Администратор",
  USER: "Пользователь"
};

export const userStatusLabels: Record<UserStatus, string> = {
  PENDING: "Ожидает",
  APPROVED: "Подтверждён",
  BLOCKED: "Заблокирован"
};

export const singleShiftRoles: ShiftRole[] = ["FOCUS_PULLER", "PLAYBACK", "GAFFER"];
export const singleProjectRoles: ProjectPersonRole[] = [
  "DP",
  "SECOND_CAMERA_OPERATOR",
  "DIRECTOR",
  "SECOND_AD"
];
