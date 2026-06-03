const axios = require('axios');

const churnPredict = async (inputData) => {
    try {
        const payload = {
            ...inputData,
            support_tickets_last_90d: inputData.support_ticket_last_90d || inputData.support_tickets_last_90d || 0, // Mapping di sini
        };

        // Panggil server Flask di Port 5001
        const response = await axios.post('http://localhost:5001/churn/predict', payload);
        
        // Kembalikan data sesuai format yang diharapkan Controller Anda
        return response.data; 
    } catch (error) {
        return {
            status: "error",
            message: error.message,
            titik_gagal: "Gagal menyambung ke AI Server (Python)"
        };
    }
};

module.exports = { churnPredict };