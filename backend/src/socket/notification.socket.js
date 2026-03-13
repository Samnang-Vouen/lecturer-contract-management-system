import Notification from "../model/notification.js";

class NotificationSocketService {

    constructor(io) {
        this.io = io;
    }

    register() {
        this.io.on('connection', (socket) => {
            socket.on('join', (user_data) => {
                const user_id = parseInt(user_data?.id, 10);
                const role = String(user_data?.role || "").toLowerCase();

                if (Number.isInteger(user_id)) {
                    socket.join(`user:${user_id}`);
                }

                if (role === 'admin' || role === 'management' || role === 'lecturer') {

                    socket.join(`role:${role}`);
                }


            });
            socket.on('disconnect', () => {
                console.log('socket disconnected : ', socket.id);
                
            });
        })
    }


    // lecturer

    async notifyLecturer({ user_id, type, message, contract_id, data }) {

        if (!Number.isInteger(user_id)) return null;

        const notif = await Notification.create({
            user_id,
            type,
            message,
            contract_id: contract_id || null,
            data: data || null,
            readAt: null,
        })

        this.io.to(`user:${user_id}`).emit('notification:new', notif.toJSON());

        return notif;

    }


    async notifyLecturers({ user_ids, type, message, contractId, data }) {
        const ids = (user_ids || [])
            .map((n) => parseInt(n, 10))
            .filter((n) => Number.isInteger(n));

        if (!ids.length) return [];

        const rows = ids.map((uid) => ({
            user_id: uid,
            type,
            message,
            contract_id: contractId || null,
            data: data || null,
            readAt: null,
        }));

        const transaction = await Notification.sequelize.transaction();
        try {
            const created = await Notification.bulkCreate(rows, { transaction });
            await transaction.commit();

            for (const n of created) {
                this.io.to(`user:${n.user_id}`).emit('notification:new', n.toJSON());
            }

            return created;
        } catch (error) {
            await transaction.rollback();
            console.error('notifylecturers failed:', error);
            return [];
        }
    }
    

    async contractStatusChanged({ contractId, newStatus, recipient, changedBy }) {
        const message = `Contract #${contractId} status changed to ${newStatus}`;

        return this.notifyLecturer({
            user_id: recipient,
            type: 'status_change',
            message,
            contract_id: contractId,
            data: {
                contractId,
                status: newStatus,
                changedBy: changedBy || null,
                at: new Date().toISOString(),
            },
        });
    }

    broadcastToRole({ role, type, message, contractId, data }) {
        const payload = {
            type,
            message,
            contract_id: contractId || null,
            data: data || null,
            createdAt: new Date().toISOString(),
        };
        this.io.to(`role:${role}`).emit('notification:new', payload);
    }

}

export default NotificationSocketService;