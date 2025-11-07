import React from 'react';
import './Certificate.css';

/**
 * Componente Certificate - Certificado de Participación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.participantName - Nombre completo del participante
 * @param {string} props.courseName - Nombre del curso
 * @param {string} props.eventName - Nombre del evento
 * @param {string} props.creatorName - Nombre del creador/organizador
 * @param {string} props.date - Fecha del certificado (opcional, usa fecha actual si no se proporciona)
 * @param {Function} props.onPrint - Callback para cuando se imprime el certificado (opcional)
 */
const Certificate = ({
  participantName = '[Nombre del Participante]',
  courseName = '[Nombre del Curso]',
  eventName = '[Nombre del Evento]',
  creatorName = '[Nombre del Creador]',
  date = null,
  onPrint = null
}) => {
  // Formatear fecha
  const formatDate = (dateValue) => {
    if (!dateValue) {
      const today = new Date();
      return today.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      return parsedDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return dateValue;
  };

  // Función para imprimir el certificado
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    window.print();
  };

  return (
    <div className="certificate-wrapper">
      <div className="certificate-container">
        {/* Esquinas decorativas */}
        <div className="corner corner-tl"></div>
        <div className="corner corner-tr"></div>
        <div className="corner corner-bl"></div>
        <div className="corner corner-br"></div>
        
        {/* Sello decorativo */}
        <div className="seal">
          <div className="seal-text">CERTIFICADO<br />OFICIAL</div>
        </div>
        
        <div className="certificate-content">
          {/* Encabezado */}
          <div className="certificate-header">
            <h1 className="certificate-title">Certificado</h1>
            <p className="certificate-subtitle">de Participación</p>
          </div>
          
          {/* Cuerpo del certificado */}
          <div className="certificate-body">
            <p className="certify-text">
              Se otorga el presente certificado a:
            </p>
            
            <div className="participant-name">
              {participantName}
            </div>
            
            <p className="certify-text">
              Por su destacada participación en el curso:
            </p>
            
            <div className="course-name">
              {courseName}
            </div>
            
            <div className="course-info">
              realizado en el marco del evento:
            </div>
            
            <div className="event-name">
              {eventName}
            </div>
          </div>
          
          {/* Fecha */}
          <div className="date-section">
            {formatDate(date)}
          </div>
          
          {/* Firma */}
          <div className="certificate-footer">
            <div className="signature-block">
              <div className="signature-line"></div>
              <div className="signature-name">{creatorName}</div>
              <div className="signature-title">Organizador del Evento</div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de impresión (oculto en impresión) */}
      <div className="print-button-container">
        <button 
          className="print-button" 
          onClick={handlePrint}
          aria-label="Imprimir certificado"
        >
          🖨️ Imprimir Certificado
        </button>
      </div>
    </div>
  );
};

export default Certificate;
