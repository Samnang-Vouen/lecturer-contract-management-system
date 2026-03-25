import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSocket } from "../../../services/socket";
import { loadEvaluationUploadData } from "../../../services/evaluationUpload.service";

export function useEvaluationUploadData(authUser) {
  const [mappings, setMappings] = useState([]);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadEvaluationUploadData();
      setMappings(data.mappings);
      setRows(data.rows);
    } catch (error) {
      console.error("[UploadEvaluation] failed to load mappings", error);
      toast.error("Failed to load lecturer list");
      setMappings([]);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (!authUser?.id) return undefined;

    const socket = getSocket();
    const joinRoom = () => {
      socket.emit("join", { id: authUser.id, role: authUser.role });
    };
    const onEvaluationUploaded = async () => {
      await loadRows();
      toast.success("Evaluation list updated in real time");
    };

    socket.on("connect", joinRoom);
    socket.on("evaluation:uploaded", onEvaluationUploaded);

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("evaluation:uploaded", onEvaluationUploaded);
    };
  }, [authUser?.id, authUser?.role, loadRows]);

  return {
    mappings,
    rows,
    isLoading,
    loadRows,
  };
}