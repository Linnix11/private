const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT']
}));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'RestApi'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connecté à la base de données MySQL');
    }
});

// ROUTES

// GET all items
app.get('/items', (req, res) => {
    const query = `
        SELECT 
            i.*,
            c.name as category_name,
            c.id as category_id
        FROM items i
        LEFT JOIN items_categories ic ON i.id = ic.item_id
        LEFT JOIN categories c ON ic.category_id = c.id
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Erreur lors de la récupération des items:", err);
            res.status(500).send("Erreur serveur");
            return;
        }
        res.json(results);
    });
});

// ADD item
app.post('/items', (req, res) => {
    const {name, price, description, quantity, id_category} = req.body;
    
    db.beginTransaction(err => {
        if (err) {
            console.error("Erreur transaction:", err);
            return res.status(500).send("Erreur serveur");
        }

        db.query('INSERT INTO items (name, price, description, quantity) VALUES (?, ?, ?, ?)', 
            [name, price, description, quantity || 0],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error("Erreur insertion item:", err);
                        res.status(500).send("Erreur serveur");
                    });
                }

                const itemId = result.insertId;

                db.query('INSERT INTO items_categories (item_id, category_id) VALUES (?, ?)',
                    [itemId, id_category],
                    (err2) => {
                        if (err2) {
                            return db.rollback(() => {
                                console.error("Erreur catégorie:", err2);
                                res.status(500).send("Erreur serveur");
                            });
                        }

                        db.commit(err3 => {
                            if (err3) {
                                return db.rollback(() => {
                                    res.status(500).send("Erreur serveur");
                                });
                            }
                            res.status(201).json({
                                id: itemId,
                                name,
                                price,
                                description,
                                quantity,
                                category_id: id_category
                            });
                        });
                    }
                );
            }
        );
    });
});

// UPDATE item
app.put('/items/:id', (req, res) => {
    const itemId = req.params.id;
    const {name, price, description, quantity} = req.body;

    // Update quantity only
    if (quantity !== undefined && Object.keys(req.body).length === 1) {
        db.query(
            'UPDATE items SET quantity = ? WHERE id = ?',
            [quantity, itemId],
            (err, result) => {
                if (err) {
                    console.error("Erreur mise à jour quantité:", err);
                    res.status(500).send("Erreur serveur");
                    return;
                }
                if (result.affectedRows === 0) {
                    res.status(404).send("Item non trouvé");
                    return;
                }
                res.json({
                    id: itemId,
                    quantity,
                    message: "Quantité mise à jour"
                });
            }
        );
        return;
    }

    // Full update
    db.query(
        'UPDATE items SET name = ?, price = ?, description = ?, quantity = ? WHERE id = ?',
        [name, price, description, quantity, itemId],
        (err, result) => {
            if (err) {
                console.error("Erreur mise à jour:", err);
                res.status(500).send("Erreur serveur");
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).send("Item non trouvé");
                return;
            }
            res.json({
                id: itemId,
                name,
                price,
                description,
                quantity
            });
        }
    );
});

// DELETE item
app.delete('/items/:id', (req, res) => {
    const itemId = req.params.id;

    db.beginTransaction(err => {
        if (err) {
            console.error("Erreur transaction:", err);
            return res.status(500).send("Erreur serveur");
        }

        db.query('DELETE FROM items_categories WHERE item_id = ?', [itemId], (err1) => {
            if (err1) {
                return db.rollback(() => {
                    res.status(500).send("Erreur suppression");
                });
            }

            db.query('DELETE FROM items WHERE id = ?', [itemId], (err2, result) => {
                if (err2) {
                    return db.rollback(() => {
                        res.status(500).send("Erreur suppression");
                    });
                }

                if (result.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).send("Item non trouvé");
                    });
                }

                db.commit(err3 => {
                    if (err3) {
                        return db.rollback(() => {
                            res.status(500).send("Erreur serveur");
                        });
                    }
                    res.json({ message: "Item supprimé" });
                });
            });
        });
    });
});



// CATEGORIES
app.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) {
            console.error("Erreur catégories:", err);
            res.status(500).send("Erreur serveur");
            return;
        }
        res.json(results);
    });
});

// AUTH
app.post('/login', (req, res) => {
    const {email, password} = req.body;
    
    db.query(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password],
        (err, results) => {
            if (err) {
                res.status(500).json({message: "Erreur serveur"});
                return;
            }
            
            if (results.length === 0) {
                res.status(401).json({message: "Email ou mot de passe incorrect"});
                return;
            }
            
            res.json({
                message: "Connexion réussie",
                user: {
                    id: results[0].id,
                    username: results[0].username,
                    email: results[0].email
                }
            });
        }
    );
});


app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});