import { BrochureState } from '@/types/brochure';
import { SlideContainer } from './SlideContainer';
import { SlideHeader } from './SlideHeader';
import { User, Phone, Mail, MapPin } from 'lucide-react';

interface ContactSlideProps {
  id?: string;
  state: BrochureState;
}

export function ContactSlide({ id, state }: ContactSlideProps) {
  const hasContact =
    state.contactName ||
    state.contactPhone ||
    state.contactEmail ||
    state.contactAddress;

  return (
    <SlideContainer id={id}>
      <SlideHeader companyName={state.companyName || 'AUTOPILOT'} />

      <div className="flex flex-col h-full">
        <h2 className="text-4xl font-bold text-foreground mb-8">
          Contact Us
        </h2>

        <div className="flex gap-12 flex-1 items-center">
          {/* Contact Info */}
          <div className="w-1/2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-10 space-y-6">
              {state.contactName && (
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    <User className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Contact Person
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {state.contactName}
                    </p>
                  </div>
                </div>
              )}

              {state.contactPhone && (
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                    <Phone className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Phone
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {state.contactPhone}
                    </p>
                  </div>
                </div>
              )}

              {state.contactEmail && (
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Mail className="h-7 w-7 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Email
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {state.contactEmail}
                    </p>
                  </div>
                </div>
              )}

              {state.contactAddress && (
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                    <MapPin className="h-7 w-7 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Address
                    </p>
                    <p className="text-xl font-semibold text-foreground">
                      {state.contactAddress}
                    </p>
                  </div>
                </div>
              )}

              {!hasContact && (
                <p className="text-xl text-muted-foreground text-center py-8">
                  No contact information provided
                </p>
              )}
            </div>
          </div>

          {/* Decorative / Company Logo */}
          <div className="w-1/2 flex items-center justify-center">
            {state.companyLogo ? (
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <img
                  src={state.companyLogo.previewUrl}
                  alt="Company Logo"
                  className="max-w-full max-h-[350px] object-contain"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-teal-400 to-blue-500 rounded-3xl p-12 shadow-xl">
                <p className="text-5xl font-bold text-white">
                  {state.companyName || 'AUTOPILOT'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideContainer>
  );
}
