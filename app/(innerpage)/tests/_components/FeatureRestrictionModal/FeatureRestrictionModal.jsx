import React from 'react';
import { Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FeatureRestrictionModal = ({ isOpen, onClose, onViewPlans }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2c2c2c] text-white border-gray-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Pro Feature
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-300 mb-6">
            Adding custom career is a Pro feature. Upgrade your plan to unlock:
          </p>
          <ul className="space-y-2 text-gray-300 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              Add up to 5 different custom careers
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              Manual career addition beyond suggestions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              Get personalized feedback
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onViewPlans}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            View Plans
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureRestrictionModal;