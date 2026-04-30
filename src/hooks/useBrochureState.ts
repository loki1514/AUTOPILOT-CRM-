import { useState, useMemo, useCallback } from 'react';
import {
  BrochureState,
  BrochureImage,
  BrochureTemplate,
  BrochureCity,
  CustomCity,
  CustomField,
  KeyDistance,
  ComparisonProperty,
  SlideConfig,
  WizardStep,
  initialBrochureState,
  DEFAULT_SLIDES,
} from '@/types/brochure';

export function useBrochureState() {
  const [state, setState] = useState<BrochureState>(initialBrochureState);

  // Computed: which fields are populated
  const populatedFields = useMemo(() => {
    const fields: Record<string, boolean> = {};

    if (state.propertyName?.trim()) fields.propertyName = true;
    if (state.location?.trim()) fields.location = true;
    if (state.googleLocationUrl?.trim()) fields.googleLocationUrl = true;
    if (state.superBuiltUpArea !== null) fields.superBuiltUpArea = true;
    if (state.floorNumbers?.trim()) fields.floorNumbers = true;
    if (state.contiguous) fields.contiguous = true;
    if (state.possessionToday?.trim()) fields.possessionToday = true;
    if (state.carpetArea !== null) fields.carpetArea = true;
    if (state.builtUpArea !== null) fields.builtUpArea = true;
    if (state.totalSeats !== null) fields.totalSeats = true;
    if (state.noOfFloors !== null) fields.noOfFloors = true;
    if (state.interiorDetails) fields.interiorDetails = true;
    if (state.possessionDate?.trim()) fields.possessionDate = true;
    if (state.rentPerSqft !== null) fields.rentPerSqft = true;
    if (state.camCharges !== null) fields.camCharges = true;
    if (state.leaseTerm) fields.leaseTerm = true;
    if (state.escalation !== null) fields.escalation = true;
    if (state.securityDeposit?.trim()) fields.securityDeposit = true;
    if (state.mepSanctionedLoad?.trim()) fields.mepSanctionedLoad = true;
    if (state.mepDgBackup?.trim()) fields.mepDgBackup = true;
    if (state.mepHvacType?.trim()) fields.mepHvacType = true;
    if (state.mepHvacOperatingHours?.trim()) fields.mepHvacOperatingHours = true;
    if (state.mepNightRestrictions?.trim()) fields.mepNightRestrictions = true;
    if (state.complianceOcStatus?.trim()) fields.complianceOcStatus = true;
    if (state.complianceFireNocStatus?.trim()) fields.complianceFireNocStatus = true;
    if (state.complianceLiftLicenseStatus?.trim()) fields.complianceLiftLicenseStatus = true;
    if (state.complianceProofNotes?.trim()) fields.complianceProofNotes = true;
    if (state.complianceProof) fields.complianceProof = true;
    if (state.nightShiftApproachRoadLighting) fields.nightShiftApproachRoadLighting = true;
    if (state.nightShiftSecurityPosture) fields.nightShiftSecurityPosture = true;
    if (state.nightShiftSeparateEntry) fields.nightShiftSeparateEntry = true;
    if (state.nightShiftCabPickupSpace) fields.nightShiftCabPickupSpace = true;
    if (state.amenities?.length > 0) fields.amenities = true;
    if (state.customFields?.length > 0) fields.customFields = true;
    if (state.images?.length > 0) fields.images = true;
    if (state.companyName?.trim()) fields.companyName = true;
    if (state.companyTagline?.trim()) fields.companyTagline = true;
    if (state.companyDescription?.trim()) fields.companyDescription = true;
    if (state.companyLogo) fields.companyLogo = true;
    if (state.teamImage) fields.teamImage = true;
    if (state.contactName?.trim()) fields.contactName = true;
    if (state.contactPhone?.trim()) fields.contactPhone = true;
    if (state.contactEmail?.trim()) fields.contactEmail = true;
    if (state.contactAddress?.trim()) fields.contactAddress = true;
    if (state.keyDistances?.length > 0) fields.keyDistances = true;

    return fields;
  }, [state]);

  const hasAnyData = useMemo(() => {
    return Object.keys(populatedFields).length > 0;
  }, [populatedFields]);

  // Get enabled slides in order, with dynamic expansion for comparison properties
  const enabledSlides = useMemo(() => {
    const baseSlides = [...state.slides]
      .filter((s) => s.enabled)
      .sort((a, b) => a.order - b.order);

    // Expand project-showcase into multiple slides if comparison properties exist
    const expandedSlides: SlideConfig[] = [];
    
    baseSlides.forEach((slide) => {
      expandedSlides.push(slide);
      
      // After the main project-showcase, insert slides for each comparison property
      if (slide.type === 'project-showcase' && state.comparisonProperties.length > 0) {
        state.comparisonProperties.forEach((property, index) => {
          expandedSlides.push({
            id: `project-showcase-property-${property.id}`,
            type: 'project-showcase-property',
            enabled: true,
            order: slide.order + 0.1 + (index * 0.1),
            propertyIndex: index,
          });
        });
      }
    });

    return expandedSlides;
  }, [state.slides, state.comparisonProperties]);

  // Actions
  const updateField = useCallback(
    <K extends keyof BrochureState>(field: K, value: BrochureState[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addImage = useCallback((file: File) => {
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    const newImage: BrochureImage = { id, file, previewUrl };
    setState((prev) => ({
      ...prev,
      images: [...prev.images, newImage],
    }));
  }, []);

  const removeImage = useCallback((id: string) => {
    setState((prev) => {
      const imageToRemove = prev.images.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return {
        ...prev,
        images: prev.images.filter((img) => img.id !== id),
      };
    });
  }, []);

  const reorderImages = useCallback((oldIndex: number, newIndex: number) => {
    setState((prev) => {
      const newImages = [...prev.images];
      const [removed] = newImages.splice(oldIndex, 1);
      newImages.splice(newIndex, 0, removed);
      return { ...prev, images: newImages };
    });
  }, []);

  const addCustomField = useCallback(() => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: '',
      value: '',
    };
    setState((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));
  }, []);

  const updateCustomField = useCallback(
    (id: string, field: 'label' | 'value', value: string) => {
      setState((prev) => ({
        ...prev,
        customFields: prev.customFields.map((cf) =>
          cf.id === id ? { ...cf, [field]: value } : cf
        ),
      }));
    },
    []
  );

  const removeCustomField = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((cf) => cf.id !== id),
    }));
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setState((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }, []);

  // Company/Team image management
  const setCompanyLogo = useCallback((file: File | null) => {
    setState((prev) => {
      if (prev.companyLogo) {
        URL.revokeObjectURL(prev.companyLogo.previewUrl);
      }
      if (!file) {
        return { ...prev, companyLogo: null };
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      return { ...prev, companyLogo: { id, file, previewUrl } };
    });
  }, []);

  const setTeamImage = useCallback((file: File | null) => {
    setState((prev) => {
      if (prev.teamImage) {
        URL.revokeObjectURL(prev.teamImage.previewUrl);
      }
      if (!file) {
        return { ...prev, teamImage: null };
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      return { ...prev, teamImage: { id, file, previewUrl } };
    });
  }, []);

  // Compliance proof image management
  const setComplianceProof = useCallback((file: File | null) => {
    setState((prev) => {
      if (prev.complianceProof) {
        URL.revokeObjectURL(prev.complianceProof.previewUrl);
      }
      if (!file) {
        return { ...prev, complianceProof: null };
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      return { ...prev, complianceProof: { id, file, previewUrl } };
    });
  }, []);

  // Comparison property compliance proof management
  const setComparisonPropertyComplianceProof = useCallback((propertyId: string, file: File | null) => {
    setState((prev) => {
      const property = prev.comparisonProperties.find((cp) => cp.id === propertyId);
      if (property?.complianceProof) {
        URL.revokeObjectURL(property.complianceProof.previewUrl);
      }
      
      let newImage: { id: string; file: File; previewUrl: string } | null = null;
      if (file) {
        newImage = {
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        };
      }
      
      return {
        ...prev,
        comparisonProperties: prev.comparisonProperties.map((cp) =>
          cp.id === propertyId ? { ...cp, complianceProof: newImage } : cp
        ),
      };
    });
  }, []);
  const addKeyDistance = useCallback(() => {
    const newDistance: KeyDistance = {
      id: crypto.randomUUID(),
      place: '',
      distance: '',
    };
    setState((prev) => ({
      ...prev,
      keyDistances: [...prev.keyDistances, newDistance],
    }));
  }, []);

  const updateKeyDistance = useCallback(
    (id: string, field: 'place' | 'distance', value: string) => {
      setState((prev) => ({
        ...prev,
        keyDistances: prev.keyDistances.map((kd) =>
          kd.id === id ? { ...kd, [field]: value } : kd
        ),
      }));
    },
    []
  );

  const removeKeyDistance = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      keyDistances: prev.keyDistances.filter((kd) => kd.id !== id),
    }));
  }, []);

  // Comparison property management
  const addComparisonProperty = useCallback(() => {
    const newProperty: ComparisonProperty = {
      id: crypto.randomUUID(),
      name: '',
      location: '',
      googleLocationUrl: '',
      superBuiltUpArea: null,
      floorNumbers: '',
      contiguous: '',
      possessionToday: '',
      carpetArea: null,
      builtUpArea: null,
      totalSeats: null,
      noOfFloors: '',
      floorOffered: '',
      interiorDetails: '',
      possessionDate: '',
      rentPerSqft: null,
      camCharges: null,
      leaseTerm: '',
      escalation: null,
      securityDeposit: '',
      mepSanctionedLoad: '',
      mepDgBackup: '',
      mepHvacType: '',
      mepHvacOperatingHours: '',
      mepNightRestrictions: '',
      complianceOcStatus: '',
      complianceFireNocStatus: '',
      complianceLiftLicenseStatus: '',
      complianceProofNotes: '',
      complianceProof: null,
      nightShiftApproachRoadLighting: '',
      nightShiftSecurityPosture: '',
      nightShiftSeparateEntry: '',
      nightShiftCabPickupSpace: '',
      amenities: [],
      customFields: [],
      images: [],
    };
    setState((prev) => ({
      ...prev,
      comparisonProperties: [...prev.comparisonProperties, newProperty],
    }));
  }, []);

  const addComparisonPropertyCustomField = useCallback((propertyId: string) => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: '',
      value: '',
    };
    setState((prev) => ({
      ...prev,
      comparisonProperties: prev.comparisonProperties.map((cp) =>
        cp.id === propertyId
          ? { ...cp, customFields: [...cp.customFields, newField] }
          : cp
      ),
    }));
  }, []);

  const updateComparisonPropertyCustomField = useCallback(
    (propertyId: string, fieldId: string, key: 'label' | 'value', value: string) => {
      setState((prev) => ({
        ...prev,
        comparisonProperties: prev.comparisonProperties.map((cp) =>
          cp.id === propertyId
            ? {
                ...cp,
                customFields: cp.customFields.map((cf) =>
                  cf.id === fieldId ? { ...cf, [key]: value } : cf
                ),
              }
            : cp
        ),
      }));
    },
    []
  );

  const removeComparisonPropertyCustomField = useCallback((propertyId: string, fieldId: string) => {
    setState((prev) => ({
      ...prev,
      comparisonProperties: prev.comparisonProperties.map((cp) =>
        cp.id === propertyId
          ? { ...cp, customFields: cp.customFields.filter((cf) => cf.id !== fieldId) }
          : cp
      ),
    }));
  }, []);

  const addComparisonPropertyImage = useCallback((propertyId: string, file: File) => {
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    const newImage: BrochureImage = { id, file, previewUrl };
    setState((prev) => ({
      ...prev,
      comparisonProperties: prev.comparisonProperties.map((cp) =>
        cp.id === propertyId
          ? { ...cp, images: [...cp.images, newImage] }
          : cp
      ),
    }));
  }, []);

  const removeComparisonPropertyImage = useCallback((propertyId: string, imageId: string) => {
    setState((prev) => {
      const property = prev.comparisonProperties.find((cp) => cp.id === propertyId);
      const imageToRemove = property?.images.find((img) => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return {
        ...prev,
        comparisonProperties: prev.comparisonProperties.map((cp) =>
          cp.id === propertyId
            ? { ...cp, images: cp.images.filter((img) => img.id !== imageId) }
            : cp
        ),
      };
    });
  }, []);

  const toggleComparisonPropertyAmenity = useCallback((propertyId: string, amenity: string) => {
    setState((prev) => ({
      ...prev,
      comparisonProperties: prev.comparisonProperties.map((cp) =>
        cp.id === propertyId
          ? {
              ...cp,
              amenities: cp.amenities.includes(amenity)
                ? cp.amenities.filter((a) => a !== amenity)
                : [...cp.amenities, amenity],
            }
          : cp
      ),
    }));
  }, []);

  const updateComparisonProperty = useCallback(
    <K extends keyof ComparisonProperty>(id: string, field: K, value: ComparisonProperty[K]) => {
      setState((prev) => ({
        ...prev,
        comparisonProperties: prev.comparisonProperties.map((cp) =>
          cp.id === id ? { ...cp, [field]: value } : cp
        ),
      }));
    },
    []
  );

  const removeComparisonProperty = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      comparisonProperties: prev.comparisonProperties.filter((cp) => cp.id !== id),
    }));
  }, []);

  // Slide management
  const toggleSlide = useCallback((slideId: string) => {
    setState((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === slideId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  }, []);

  const reorderSlides = useCallback((oldIndex: number, newIndex: number) => {
    setState((prev) => {
      const enabledSlidesInOrder = [...prev.slides]
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order);

      const [movedSlide] = enabledSlidesInOrder.splice(oldIndex, 1);
      enabledSlidesInOrder.splice(newIndex, 0, movedSlide);

      // Reassign order values
      const updatedSlides = prev.slides.map((slide) => {
        const newOrderIndex = enabledSlidesInOrder.findIndex(
          (s) => s.id === slide.id
        );
        if (newOrderIndex !== -1) {
          return { ...slide, order: newOrderIndex };
        }
        return slide;
      });

      return { ...prev, slides: updatedSlides };
    });
  }, []);

  const setStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setTemplate = useCallback((template: BrochureTemplate) => {
    setState((prev) => ({ ...prev, selectedTemplate: template }));
  }, []);

  const setCity = useCallback((city: BrochureCity) => {
    setState((prev) => ({ ...prev, selectedCity: city }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 5) as WizardStep,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0) as WizardStep,
    }));
  }, []);

  const setThumbnail = useCallback((file: File | null) => {
    setState((prev) => {
      if (prev.thumbnail) {
        URL.revokeObjectURL(prev.thumbnail.previewUrl);
      }
      if (!file) {
        return { ...prev, thumbnail: null };
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      return { ...prev, thumbnail: { id, file, previewUrl } };
    });
  }, []);

  // Custom city management
  const addCustomCity = useCallback((name: string, description: string, imageFile: File | null) => {
    const cityId = `custom-${crypto.randomUUID()}`;
    let image: BrochureImage | null = null;
    
    if (imageFile) {
      image = {
        id: crypto.randomUUID(),
        file: imageFile,
        previewUrl: URL.createObjectURL(imageFile),
      };
    }
    
    const newCity: CustomCity = {
      id: cityId,
      name,
      description,
      image,
    };
    setState((prev) => ({
      ...prev,
      customCities: [...prev.customCities, newCity],
    }));
    return cityId;
  }, []);

  const updateCustomCityImage = useCallback((cityId: string, imageFile: File | null) => {
    setState((prev) => {
      const city = prev.customCities.find((c) => c.id === cityId);
      // Revoke old image URL if exists
      if (city?.image) {
        URL.revokeObjectURL(city.image.previewUrl);
      }
      
      let newImage: BrochureImage | null = null;
      if (imageFile) {
        newImage = {
          id: crypto.randomUUID(),
          file: imageFile,
          previewUrl: URL.createObjectURL(imageFile),
        };
      }
      
      return {
        ...prev,
        customCities: prev.customCities.map((c) =>
          c.id === cityId ? { ...c, image: newImage } : c
        ),
      };
    });
  }, []);

  const removeCustomCity = useCallback((id: string) => {
    setState((prev) => {
      const city = prev.customCities.find((c) => c.id === id);
      // Revoke image URL if exists
      if (city?.image) {
        URL.revokeObjectURL(city.image.previewUrl);
      }
      return {
        ...prev,
        customCities: prev.customCities.filter((c) => c.id !== id),
        // Reset to default city if the removed city was selected
        selectedCity: prev.selectedCity === id ? 'bangalore' : prev.selectedCity,
      };
    });
  }, []);

  const reset = useCallback(() => {
    // Cleanup image URLs
    state.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    if (state.companyLogo) URL.revokeObjectURL(state.companyLogo.previewUrl);
    if (state.teamImage) URL.revokeObjectURL(state.teamImage.previewUrl);
    if (state.thumbnail) URL.revokeObjectURL(state.thumbnail.previewUrl);
    if (state.complianceProof) URL.revokeObjectURL(state.complianceProof.previewUrl);
    // Cleanup comparison property compliance proofs
    state.comparisonProperties.forEach((cp) => {
      if (cp.complianceProof) URL.revokeObjectURL(cp.complianceProof.previewUrl);
    });
    setState(initialBrochureState);
  }, [state.images, state.companyLogo, state.teamImage, state.thumbnail, state.complianceProof, state.comparisonProperties]);

  return {
    state,
    populatedFields,
    hasAnyData,
    enabledSlides,
    updateField,
    addImage,
    removeImage,
    reorderImages,
    addCustomField,
    updateCustomField,
    removeCustomField,
    toggleAmenity,
    setCompanyLogo,
    setTeamImage,
    setComplianceProof,
    addKeyDistance,
    updateKeyDistance,
    removeKeyDistance,
    addComparisonProperty,
    updateComparisonProperty,
    removeComparisonProperty,
    addComparisonPropertyImage,
    removeComparisonPropertyImage,
    toggleComparisonPropertyAmenity,
    addComparisonPropertyCustomField,
    updateComparisonPropertyCustomField,
    removeComparisonPropertyCustomField,
    setComparisonPropertyComplianceProof,
    toggleSlide,
    reorderSlides,
    setStep,
    setTemplate,
    setCity,
    setThumbnail,
    addCustomCity,
    updateCustomCityImage,
    removeCustomCity,
    nextStep,
    prevStep,
    reset,
  };
}

export type BrochureStateActions = ReturnType<typeof useBrochureState>;
