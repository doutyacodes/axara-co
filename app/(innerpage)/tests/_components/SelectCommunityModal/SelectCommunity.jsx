'use client';

import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

function SelectCommunity({handleComplete, handleCheckboxChange, selectedCommunities}) {
    const [open, setOpen] = useState(true);
    const [error, setError] = useState('');

    const globalSelected = selectedCommunities.global
    const countrySelected = selectedCommunities.countrySpecific
    
    const handleConfirm = () => {
        // Check if at least one community is selected
        if (!globalSelected && !countrySelected) {
        setError('Please select at least one community to continue.');
        return;
        }

        // Clear any existing error
        setError('');

        // Trigger the complete action with selected communities
        handleComplete();

        // Close the modal
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
            <DialogBackdrop transition className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Choose Your Community
                        </DialogTitle>
                        <div className="mt-2">
                        <p className="text-md text-gray-500">
                            Select the communities where you want to post your progress.
                        </p>
                        </div>
                        <div className="mt-4">
                        <div className="space-y-4">
                            <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-blue-600"
                                checked={globalSelected}
                                onChange={(e) => handleCheckboxChange('global', e.target.checked)}
                            />
                            <span className="ml-2 text-gray-700">Global Community</span>
                            </label>
                            <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-blue-600"
                                checked={countrySelected}
                                onChange={(e) => handleCheckboxChange('countrySpecific', e.target.checked)}
                            />
                            <span className="ml-2 text-gray-700">Country-specific Community</span>
                            </label>
                        </div>
                        </div>
                    </div>
                    </div>

                    {/* Show error message if validation fails */}
                    {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                    type="button"
                    onClick={handleConfirm}
                    className={`inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto ${
                        !globalSelected && !countrySelected ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    >
                    Confirm
                    </button>
                    <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200 sm:mt-0 sm:w-auto"
                    >
                    Cancel
                    </button>
                </div>
                </DialogPanel>
            </div>
            </div>
        </Dialog>
    );
}

export default SelectCommunity;
