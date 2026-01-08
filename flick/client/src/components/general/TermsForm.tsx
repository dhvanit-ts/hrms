import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";

export const TermsForm = ({ showTerms, setShowTerms, onSubmitTerms }: {
  showTerms: boolean;
  setShowTerms: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmitTerms: () => void;
}) => {
  const [accepted, setAccepted] = useState(false);
  return (
    <Dialog open={showTerms} onOpenChange={setShowTerms}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p>Before posting, you must accept our Terms and Conditions.</p>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the Terms and Conditions
            </label>
          </div>

          <Button
            onClick={onSubmitTerms}
            className="w-full"
            disabled={!accepted}
          >
            Accept and Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}