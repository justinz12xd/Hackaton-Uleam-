/**
 * EJEMPLO DE SERVICIO PARA INTEGRACIÓN CON DIFERENTES BASES DE DATOS
 */

// ============================================================
// OPCIÓN 1: MySQL / MariaDB con mysql2
// ============================================================

import mysql from 'mysql2/promise';

export class CertificateServiceMySQL {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'certificates_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async getCertificateById(id) {
    const [rows] = await this.pool.execute(
      `SELECT 
        c.id,
        c.participant_name as participantName,
        c.course_name as courseName,
        c.event_name as eventName,
        c.creator_name as creatorName,
        c.issue_date as date
      FROM certificates c
      WHERE c.id = ?`,
      [id]
    );
    return rows[0];
  }

  async getParticipantCertificates(participantId) {
    const [rows] = await this.pool.execute(
      `SELECT * FROM certificates WHERE participant_id = ?`,
      [participantId]
    );
    return rows;
  }

  async createCertificate(data) {
    const [result] = await this.pool.execute(
      `INSERT INTO certificates 
        (participant_name, course_name, event_name, creator_name, issue_date) 
      VALUES (?, ?, ?, ?, ?)`,
      [data.participantName, data.courseName, data.eventName, data.creatorName, data.date || new Date()]
    );
    return result.insertId;
  }
}

// ============================================================
// OPCIÓN 2: PostgreSQL con pg
// ============================================================

import pkg from 'pg';
const { Pool } = pkg;

export class CertificateServicePostgreSQL {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'certificates_db',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async getCertificateById(id) {
    const result = await this.pool.query(
      `SELECT 
        id,
        participant_name as "participantName",
        course_name as "courseName",
        event_name as "eventName",
        creator_name as "creatorName",
        issue_date as "date"
      FROM certificates
      WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  async getParticipantCertificates(participantId) {
    const result = await this.pool.query(
      `SELECT * FROM certificates WHERE participant_id = $1`,
      [participantId]
    );
    return result.rows;
  }

  async createCertificate(data) {
    const result = await this.pool.query(
      `INSERT INTO certificates 
        (participant_name, course_name, event_name, creator_name, issue_date) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [data.participantName, data.courseName, data.eventName, data.creatorName, data.date || new Date()]
    );
    return result.rows[0].id;
  }
}

// ============================================================
// OPCIÓN 3: MongoDB con mongoose
// ============================================================

import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  participantName: { type: String, required: true },
  courseName: { type: String, required: true },
  eventName: { type: String, required: true },
  creatorName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export class CertificateServiceMongoDB {
  constructor() {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/certificates_db');
  }

  async getCertificateById(id) {
    const certificate = await Certificate.findById(id).lean();
    if (!certificate) return null;
    
    return {
      id: certificate._id,
      participantName: certificate.participantName,
      courseName: certificate.courseName,
      eventName: certificate.eventName,
      creatorName: certificate.creatorName,
      date: certificate.date
    };
  }

  async getParticipantCertificates(participantId) {
    return await Certificate.find({ participantId }).lean();
  }

  async createCertificate(data) {
    const certificate = new Certificate(data);
    await certificate.save();
    return certificate._id;
  }
}

// ============================================================
// OPCIÓN 4: Firebase Firestore
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc } from 'firebase/firestore';

export class CertificateServiceFirebase {
  constructor() {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
    };

    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  async getCertificateById(id) {
    const docRef = doc(this.db, 'certificates', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  }

  async getParticipantCertificates(participantId) {
    const q = query(
      collection(this.db, 'certificates'),
      where('participantId', '==', participantId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async createCertificate(data) {
    const docRef = await addDoc(collection(this.db, 'certificates'), {
      ...data,
      date: data.date || new Date()
    });
    return docRef.id;
  }
}

// ============================================================
// OPCIÓN 5: Supabase (PostgreSQL con API REST)
// ============================================================

import { createClient } from '@supabase/supabase-js';

export class CertificateServiceSupabase {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  async getCertificateById(id) {
    const { data, error } = await this.supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getParticipantCertificates(participantId) {
    const { data, error } = await this.supabase
      .from('certificates')
      .select('*')
      .eq('participant_id', participantId);
    
    if (error) throw error;
    return data;
  }

  async createCertificate(data) {
    const { data: result, error } = await this.supabase
      .from('certificates')
      .insert([{
        participant_name: data.participantName,
        course_name: data.courseName,
        event_name: data.eventName,
        creator_name: data.creatorName,
        issue_date: data.date || new Date()
      }])
      .select();
    
    if (error) throw error;
    return result[0].id;
  }
}

// ============================================================
// SCHEMA SQL PARA CREAR LA TABLA (MySQL/PostgreSQL)
// ============================================================

/*
CREATE TABLE certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- Para MySQL
  -- id SERIAL PRIMARY KEY,            -- Para PostgreSQL
  participant_id INT,
  participant_name VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  creator_name VARCHAR(255) NOT NULL,
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_participant_id ON certificates(participant_id);
CREATE INDEX idx_issue_date ON certificates(issue_date);
*/

// ============================================================
// EJEMPLO DE USO EN EXPRESS
// ============================================================

/*
import express from 'express';
import { CertificateServiceMySQL } from './certificateService.js';

const app = express();
const certificateService = new CertificateServiceMySQL();

app.get('/api/certificates/:id', async (req, res) => {
  try {
    const certificate = await certificateService.getCertificateById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/participants/:id/certificates', async (req, res) => {
  try {
    const certificates = await certificateService.getParticipantCertificates(req.params.id);
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/certificates', async (req, res) => {
  try {
    const id = await certificateService.createCertificate(req.body);
    res.status(201).json({ id, message: 'Certificado creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('API corriendo en http://localhost:3001');
});
*/
