import { useState, useEffect } from 'react';

/**
 * Custom Hook para obtener datos del certificado desde la base de datos
 * 
 * @param {string|number} certificateId - ID del certificado a obtener
 * @param {string} apiUrl - URL base de la API (opcional)
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useCertificateData = (certificateId, apiUrl = '/api/certificates') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCertificate = async () => {
    if (!certificateId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/${certificateId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Error al obtener datos del certificado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
  }, [certificateId, apiUrl]);

  return {
    data,
    loading,
    error,
    refetch: fetchCertificate
  };
};

/**
 * Hook alternativo para obtener lista de certificados de un participante
 * 
 * @param {string|number} participantId - ID del participante
 * @param {string} apiUrl - URL base de la API
 * @returns {Object} - { certificates, loading, error, refetch }
 */
export const useParticipantCertificates = (participantId, apiUrl = '/api/participants') => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCertificates = async () => {
    if (!participantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/${participantId}/certificates`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setCertificates(result);
    } catch (err) {
      setError(err.message);
      console.error('Error al obtener certificados del participante:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [participantId, apiUrl]);

  return {
    certificates,
    loading,
    error,
    refetch: fetchCertificates
  };
};

export default useCertificateData;
