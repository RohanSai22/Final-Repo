# mypy: disable - error - code = "no-untyped-def,misc"
import pathlib
import json
import uuid
from typing import Dict, Any, AsyncGenerator, Optional, List
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import fastapi.exceptions
from pydantic import BaseModel
from agent.graph import graph
from langchain_core.messages import HumanMessage, AIMessage

# Define the FastAPI app
app = FastAPI()

# Add CORS middleware to the main app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: When using 'langgraph dev', the LangGraph API endpoints are automatically
# exposed by the dev server based on the graphs defined in langgraph.json.
# The graph endpoints will be available at /assistants/{graph_id}/ by default.


def create_frontend_router(build_dir="../frontend/dist"):
    """Creates a router to serve the React frontend.

    Args:
        build_dir: Path to the React build directory relative to this file.

    Returns:
        A Starlette application serving the frontend.
    """
    build_path = pathlib.Path(__file__).parent.parent.parent / build_dir
    static_files_path = build_path / "assets"  # Vite uses 'assets' subdir

    if not build_path.is_dir() or not (build_path / "index.html").is_file():
        print(
            f"WARN: Frontend build directory not found or incomplete at {build_path}. Serving frontend will likely fail."
        )
        # Return a dummy router if build isn't ready
        from starlette.routing import Route

        async def dummy_frontend(request):
            return Response(
                "Frontend not built. Run 'npm run build' in the frontend directory.",
                media_type="text/plain",
                status_code=503,
            )

        return Route("/{path:path}", endpoint=dummy_frontend)

    build_dir = pathlib.Path(build_dir)

    react = FastAPI(openapi_url="")
    react.mount(
        "/assets", StaticFiles(directory=static_files_path), name="static_assets"
    )

    @react.get("/{path:path}")
    async def handle_catch_all(request: Request, path: str):
        fp = build_path / path
        if not fp.exists() or not fp.is_file():
            fp = build_path / "index.html"
        return fastapi.responses.FileResponse(fp)

    return react


# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)

# Pydantic models for API requests
class CreateThreadRequest(BaseModel):
    metadata: Optional[Dict[str, Any]] = None

class CreateRunRequest(BaseModel):
    input: Dict[str, Any]
    config: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    stream_mode: Optional[str] = "updates"

class ThreadResponse(BaseModel):
    thread_id: str
    metadata: Optional[Dict[str, Any]] = None

class RunResponse(BaseModel):
    run_id: str
    thread_id: str
    status: str

# In-memory storage for threads and runs (in production, use a proper database)
threads_storage: Dict[str, Dict[str, Any]] = {}
runs_storage: Dict[str, Dict[str, Any]] = {}

# LangGraph API endpoints that the frontend expects
@app.post("/assistants/agent/threads", response_model=ThreadResponse)
async def create_thread(request: CreateThreadRequest):
    """Create a new thread for the agent."""
    thread_id = str(uuid.uuid4())
    thread_data = {
        "thread_id": thread_id,
        "metadata": request.metadata or {},
        "messages": []
    }
    threads_storage[thread_id] = thread_data
    return ThreadResponse(thread_id=thread_id, metadata=request.metadata)

@app.post("/assistants/agent/threads/{thread_id}/runs/stream")
async def create_run_stream(thread_id: str, request: CreateRunRequest):
    """Create and stream a new run for the agent."""
    if thread_id not in threads_storage:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    run_id = str(uuid.uuid4())
    
    async def stream_events():
        try:
            # Get the input messages
            input_data = request.input
            messages = input_data.get("messages", [])
            
            # Convert to LangChain messages if needed
            if messages and isinstance(messages[-1], dict):
                last_message = messages[-1]
                if last_message.get("type") == "human":
                    user_message = HumanMessage(content=last_message.get("content", ""))
                    messages[-1] = user_message
            
            # Prepare the state
            state = {
                "messages": messages,
                "initial_search_query_count": input_data.get("initial_search_query_count", 3),
                "max_research_loops": input_data.get("max_research_loops", 3),
                "reasoning_model": input_data.get("reasoning_model", "gemini-1.5-flash-latest")
            }
            
            # Stream events from the graph
            async for event in graph.astream(state, stream_mode="updates"):
                # Format the event for the frontend
                formatted_event = {
                    "event": "on_chain_stream",
                    "run_id": run_id,
                    "data": event
                }
                
                yield f"data: {json.dumps(formatted_event)}\n\n"
            
            # Send final event
            final_event = {
                "event": "on_chain_end",
                "run_id": run_id,
                "data": {"output": state}
            }
            yield f"data: {json.dumps(final_event)}\n\n"
            
        except Exception as e:
            error_event = {
                "event": "on_chain_error",
                "run_id": run_id,
                "data": {"error": str(e)}
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        stream_events(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8"
        }
    )

@app.get("/assistants/agent/threads/{thread_id}")
async def get_thread(thread_id: str):
    """Get thread information."""
    if thread_id not in threads_storage:
        raise HTTPException(status_code=404, detail="Thread not found")
    return threads_storage[thread_id]

@app.get("/assistants/agent/threads/{thread_id}/runs/{run_id}")
async def get_run(thread_id: str, run_id: str):
    """Get run information."""
    if thread_id not in threads_storage:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if run_id not in runs_storage:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return runs_storage[run_id]
