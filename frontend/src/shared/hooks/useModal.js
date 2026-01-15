import { useState, useCallback } from 'react'

/**
 * Alert 모달 상태 관리 훅
 * 
 * @example
 * const { alertModal, showAlert, closeAlert } = useAlertModal()
 * showAlert('제목', '메시지', 'success')
 */
export function useAlertModal() {
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  const showAlert = useCallback((title, message, type = 'info') => {
    setAlertModal({ isOpen: true, title, message, type })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  return { alertModal, showAlert, closeAlert }
}

/**
 * Confirm 모달 상태 관리 훅
 * 
 * @example
 * const { confirmModal, showConfirm, closeConfirm } = useConfirmModal()
 * showConfirm('제목', '메시지', onConfirmCallback, 'danger')
 */
export function useConfirmModal() {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  })

  const showConfirm = useCallback((title, message, onConfirm, type = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  return { confirmModal, showConfirm, closeConfirm }
}

/**
 * Alert + Confirm 모달 통합 훅
 * 
 * @example
 * const { alertModal, showAlert, closeAlert, confirmModal, showConfirm, closeConfirm } = useModals()
 */
export function useModals() {
  const alert = useAlertModal()
  const confirm = useConfirmModal()

  return {
    // Alert
    alertModal: alert.alertModal,
    showAlert: alert.showAlert,
    closeAlert: alert.closeAlert,
    // Confirm
    confirmModal: confirm.confirmModal,
    showConfirm: confirm.showConfirm,
    closeConfirm: confirm.closeConfirm
  }
}

