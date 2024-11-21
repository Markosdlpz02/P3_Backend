import { Tarea, TareaModel } from "./types.ts";

export const fromModelToTask = (model: TareaModel): Tarea => ({
    id: model._id!.toString(),
    title: model.title,
    completed: model.completed,
  });
