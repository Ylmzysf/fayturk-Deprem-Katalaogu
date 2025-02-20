const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3000;

// MS SQL bağlantı ayarları
const config = {
    user: 'sa',
    password: '1000',
    server: 'localhost',
    database: 'Fayturk',
    options: {
        encrypt: false, // Eğer Azure kullanıyorsanız true yapın
        enableArithAbort: true
    }
};

// Verileri almak için bir API oluşturma
app.get('/get_data', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 1000;
    const offset = (page - 1) * pageSize;

    try {
        await sql.connect(config);
        const result = await sql.query(`SELECT Depremler.Enlem, Depremler.Boylam, Depremler.Büyüklük FROM Depremler ORDER BY Depremler.EventID OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Veri alınırken bir hata oluştu:', err);
        res.status(500).send('Veri alınırken bir hata oluştu');
    }
});

// Filtrelenmiş verileri almak için bir API oluşturma
app.get('/get_filtered_data', async (req, res) => {
    const { startDate, endDate, minLatitude, maxLatitude, minLongitude, maxLongitude, minDepth, maxDepth, minMagnitude, maxMagnitude, location } = req.query;

    try {
        await sql.connect(config);

        let query = `
            SELECT TOP 4000
                Depremler.EventID, 
                Depremler.Enlem, 
                Depremler.Boylam, 
                Depremler.Büyüklük, 
                Depremler.Tarih, 
                Depremler.Derinlik, 
                Depremler.RMS, 
                Depremler.Tip, 
                Depremler.Konum
            FROM Depremler
            WHERE 1=1
        `;

        // Tarih aralığı kontrolü
        if (startDate) query += ` AND PARSE(Depremler.Tarih AS DATETIME USING 'en-GB') >= '${startDate}'`;
        if (endDate) query += ` AND PARSE(Depremler.Tarih AS DATETIME USING 'en-GB') <= '${endDate}'`;
        
        // Enlem kontrolü
        if (minLatitude && !isNaN(minLatitude)) query += ` AND CAST(Depremler.Enlem AS FLOAT) >= ${minLatitude}`;
        if (maxLatitude && !isNaN(maxLatitude)) query += ` AND CAST(Depremler.Enlem AS FLOAT) <= ${maxLatitude}`;
        
        // Boylam kontrolü
        if (minLongitude && !isNaN(minLongitude)) query += ` AND CAST(Depremler.Boylam AS FLOAT) >= ${minLongitude}`;
        if (maxLongitude && !isNaN(maxLongitude)) query += ` AND CAST(Depremler.Boylam AS FLOAT) <= ${maxLongitude}`;
        
        // Derinlik kontrolü
        if (minDepth && !isNaN(minDepth)) query += ` AND CAST(Depremler.Derinlik AS FLOAT) >= ${minDepth}`;
        if (maxDepth && !isNaN(maxDepth)) query += ` AND CAST(Depremler.Derinlik AS FLOAT) <= ${maxDepth}`;
        
        // Büyüklük kontrolü
        if (minMagnitude && !isNaN(minMagnitude)) query += ` AND CAST(Depremler.Büyüklük AS FLOAT) >= ${minMagnitude}`;
        if (maxMagnitude && !isNaN(maxMagnitude)) query += ` AND CAST(Depremler.Büyüklük AS FLOAT) <= ${maxMagnitude}`;
        
        // Konum kontrolü
        if (location) query += ` AND Depremler.Konum LIKE '%${location}%'`;

        query += ` ORDER BY PARSE(Depremler.Tarih AS DATETIME USING 'en-GB') DESC`;

        console.log('Sorgu:', query); // Hata ayıklama için log ekleyin

        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Veri alınırken bir hata oluştu:', err);
        res.status(500).send('Veri alınırken bir hata oluştu');
    }
});



// Statik dosyaları sunma
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});

