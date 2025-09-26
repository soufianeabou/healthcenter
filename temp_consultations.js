  const fetchConsultations = async () => {
    try {
      setError('');
      const res = await fetch('https://196.12.203.182/api/consultations');
      if (!res.ok) throw new Error('Failed to fetch consultations');
      const data = await res.json(); console.log("Consultation data:", data); console.log("First consultation patient:", data[0]?.patient);
      
      // Fetch patient details for each consultation
      const consultationsWithPatients = await Promise.all(
        data.map(async (c: any) => {
          try {
            const patientRes = await fetch(`https://196.12.203.182/api/patients/${c.patientId}`);
            if (patientRes.ok) {
              const patientData = await patientRes.json();
              return { ...c, patient: patientData };
            }
          } catch (e) {
            console.error('Failed to fetch patient:', e);
          }
          return c;
        })
      );
      
      const rows: ConsultationRow[] = consultationsWithPatients.map((c: any) => ({
        id: c.id,
        patientId: c.patient?.id,
        patientName: `${c.patient?.prenom || ''} ${c.patient?.nom || ''}`.trim() || `Patient #${c.patientId}`,
        doctorName: `${c.personnel?.prenom || ''} ${c.personnel?.nom || ''}`.trim() || 'Médecin',
        consultationDate: c.dateConsultation,
        notes: [c.motif, c.diagnostic, c.traitement].filter(Boolean).join(' | '),
        status: 'COMPLETED',
        prescriptionItems: []
      }));
      setConsultations(rows);
    } catch (e) {
      console.error(e);
      setError('Erreur lors du chargement des consultations');
    }
  };
