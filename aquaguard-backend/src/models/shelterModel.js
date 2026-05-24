const db = require("../config/db");

const shelterModel = {
	findAll: async () => {
		const [rows] = await db.query(
			"SELECT * FROM shelters ORDER BY updated_at DESC",
		);
		return rows;
	},

	findAvailable: async () => {
		const [rows] = await db.query(
			"SELECT * FROM shelters WHERE status = 'open' AND current_count < capacity ORDER BY updated_at DESC",
		);
		return rows;
	},

	findById: async (id) => {
		const [rows] = await db.query("SELECT * FROM shelters WHERE id = ?", [id]);
		return rows[0];
	},

	create: async ({ name, address, capacity, latitude, longitude }) => {
		const [result] = await db.query(
			`INSERT INTO shelters (name, address, capacity, current_count, latitude, longitude)
			 VALUES (?, ?, ?, 0, ?, ?)` ,
			[name, address, capacity, latitude, longitude],
		);
		return result.insertId;
	},

	update: async (id, { name, address, capacity, latitude, longitude }) => {
		await db.query(
			`UPDATE shelters SET name = ?, address = ?, capacity = ?, latitude = ?, longitude = ? WHERE id = ?`,
			[name, address, capacity, latitude, longitude, id],
		);
	},

	delete: async (id) => {
		await db.query("DELETE FROM shelters WHERE id = ?", [id]);
	},

	updateCount: async (id, delta) => {
		await db.query(
			"UPDATE shelters SET current_count = current_count + ? WHERE id = ?",
			[delta, id],
		);
	},
};

module.exports = shelterModel;
