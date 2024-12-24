'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { useTranslations } from 'next-intl'

function AddIndustry({ isOpen, onClose, fetchResults}) {
    const t = useTranslations('AddIndustry');
    const [selectedIndustry, setSelectedIndustry] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = ()=>{
        fetchResults(selectedIndustry)
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                    >
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                        {t('title')}
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            {t('message')}
                                        </p>
                                        <input
                                            type="text"
                                            value={selectedIndustry}
                                            onChange={(e) => setSelectedIndustry(e.target.value)}
                                            className="mt-4 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Enter Industry name"
                                        />
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6  max-sm:space-y-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto 
                            ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            {loading ? (
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                                    ></path>
                                </svg>
                            ) : (
                                t('submit')
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            /* disabled={roadMapLoading}  */// Disable Cancel button too if needed
                            className={`inline-flex w-full justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-gray-300 sm:w-auto 
                            `}
                        >
                            {/* ${roadMapLoading ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50'} */}
                            {t('cancel')}
                        </button>
                    </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}

export default AddIndustry
