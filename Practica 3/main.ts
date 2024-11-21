import { MongoClient, ObjectId } from "mongodb";
import { TareaModel } from "./types.ts";
import { fromModelToTask } from "./utils.ts";


const MONGO_URL = Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");


const db = client.db("GestorTareas");
const tareasCollection = db.collection<TareaModel>("tareas");


const handler = async (req: Request): Promise<Response> => {

  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if(method ==="GET"){

    if(path === "/tasks"){
      const tasksDB = await tareasCollection.find().toArray();
        const tasks = await Promise.all(
          tasksDB.map((t) => fromModelToTask(t))
        );
        return new Response(JSON.stringify(tasks));
    }
    else if (path.startsWith("/tasks/")) {
      const id = path.split("/").pop(); 
      const mismoID = await tareasCollection.findOne({ _id: new ObjectId(id) });
    
      if (!mismoID) {
        return new Response("Tarea no encontrada", { status: 404 });
      }
      const task = await fromModelToTask(mismoID);
      
      return new Response(JSON.stringify(task));
    }

  } else if(method==="POST"){

    if(path === "/tasks"){
      const task = await req.json();
      if (!task.title) {
        return new Response("Bad request", { status: 400 });
      }
      const { insertedId } = await tareasCollection.insertOne({
        title: task.title,
        completed: false,
      });
      return new Response(
        JSON.stringify({
          id: insertedId,
          title: task.title,
          completed: false,
        }),
      );
    }

  } else if(method ==="PUT"){

    if (path.startsWith("/tasks/")) {
      const id = path.split("/").pop(); 
      const task = await req.json();
      if (!task.completed) {
        return new Response("Bad request", { status: 400 });
      }
      
      const { modifiedCount } = await tareasCollection.updateOne(
        { _id: new ObjectId(id)},
        { $set: { completed: task.completed } }
      );

      if (modifiedCount === 0) {
        return new Response("Tarea no encontrada", { status: 404 });
      }

      const actualizada = await tareasCollection.findOne({ _id: new ObjectId(id)});

      return new Response(
        JSON.stringify({
          id: actualizada?._id,
          title: actualizada?.title,
          completed: actualizada?.completed,
        }),
      );
    }

  } else if(method ==="DELETE"){

    if (path.startsWith("/tasks/")) {
      const id = path.split("/").pop(); 
      const { deletedCount } = await tareasCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (deletedCount === 0) {
        return new Response("Tarea no encontrada", { status: 404 });
      }

      return new Response("Tarea eliminada correctamente", { status: 200 });
    }
  }

  return new Response("Endpoint not found", { status: 404 });
  
}
Deno.serve({ port: 3000 }, handler);