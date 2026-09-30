import axios from 'axios';
import {
  HealthResponse,
  StatsResponse,
  DocumentInfo,
  UploadResponse,
  ChatResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};

export const fetchStats = async (): Promise<StatsResponse> => {
  const response = await apiClient.get<StatsResponse>('/stats');
  return response.data;
};

export const fetchDocuments = async (collection: string = 'documents'): Promise<DocumentInfo[]> => {
  const response = await apiClient.get<DocumentInfo[]>(`/documents?collection=${collection}`);
  return response.data;
};

export const deleteDocuments = async (collection: string = 'documents'): Promise<{ message: string; deleted_count: number }> => {
  const response = await apiClient.delete<{ message: string; deleted_count: number }>(`/documents?collection=${collection}`);
  return response.data;
};

export const uploadFiles = async (files: File[], collection: string = 'documents'): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('collection_name', collection);

  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const sendChatMessage = async (
  question: string,
  collectionName: string = 'documents',
  topK: number = 5
): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>('/chat', {
    question,
    collection_name: collectionName,
    top_k: topK,
  });
  return response.data;
};
