export async function createRedoRequest(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.validated?.body || req.body || {};
    const message = String(body.message || '').trim();

    if (!message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'message is required' });
    }

    const contract = await requireTeachingContractViewAccess(req, res, id, {
      attributes: ['id', 'lecturer_user_id', 'status'],
    });
    if (!contract) return;

    const role = String(req.user?.role || '').toLowerCase();
    const requesterRole = role === 'lecturer' ? 'LECTURER' : 'MANAGEMENT';

    const tx = await sequelize.transaction();
    try {
      const reqRow = await ContractRedoRequest.create(
        {
          contract_id: id,
          requester_user_id: req.user.id,
          requester_role: requesterRole,
          message,
        },
        { transaction: tx }
      );

      await contract.update(
        {
          status: 'REQUEST_REDO',
          management_remarks: message || null,
          lecturer_signature_path: null,
          management_signature_path: null,
          lecturer_signed_at: null,
          management_signed_at: null,
          pdf_path: null,
        },
        { transaction: tx }
      );

      await tx.commit();

      // ── Notify the right people ─────────────────────────────────────────
      // If lecturer requested redo → notify management + admin
      // If management requested redo → notify the lecturer
      try {
        const notificationSocket = getNotificationSocket();

        if (requesterRole === 'LECTURER') {
          notificationSocket.broadcastToRole({
            role: 'management',
            type: 'redo_request',
            message: `Contract #${id} redo requested by lecturer: "${message}"`,
            contractId: id,
          });
          notificationSocket.broadcastToRole({
            role: 'admin',
            type: 'redo_request',
            message: `Contract #${id} redo requested by lecturer: "${message}"`,
            contractId: id,
          });
        } else {
          // Management requested redo → notify the lecturer
          notificationSocket.notifyLecturer({
            user_id: contract.lecturer_user_id,
            type: 'redo_request',
            message: `Contract #${id} requires changes: "${message}"`,
            contract_id: id,
          });
          notificationSocket.broadcastToRole({
            role: 'admin',
            type: 'redo_request',
            message: `Contract #${id} redo requested by management: "${message}"`,
            contractId: id,
          });
        }
      } catch (notifErr) {
        // Notification failure should never block the response
        console.error('[createRedoRequest] notification failed:', notifErr);
      }

      return res.status(HTTP_STATUS.CREATED).json({ id: reqRow.id });
    } catch (innerErr) {
      try { await tx.rollback(); } catch {}
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Failed to create redo request',
        error: innerErr?.message || 'Unknown error',
      });
    }
  } catch (e) {
    console.error('[createRedoRequest]', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({
      message: 'Failed to create redo request',
      error: e.message,
    });
  }
}