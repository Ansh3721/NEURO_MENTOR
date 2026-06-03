(() => {
  'use strict';

  const forms = document.querySelectorAll('.needs-validation');

  Array.from(forms).forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }

      form.classList.add('was-validated');
    }, false);
  });

  const educatorForm = document.getElementById('educatorRegistrationForm');

  if (!educatorForm) {
    return;
  }

  const draftKey = educatorForm.dataset.draftKey;
  const steps = Array.from(educatorForm.querySelectorAll('[data-step]'));
  const stepPills = Array.from(document.querySelectorAll('[data-step-pill]'));
  const progressBar = document.querySelector('[data-progress-bar]');
  const stepCaption = document.querySelector('[data-step-caption]');
  const prevButton = educatorForm.querySelector('[data-prev-step]');
  const nextButton = educatorForm.querySelector('[data-next-step]');
  const submitButton = educatorForm.querySelector('[data-submit-form]');
  const saveDraftButtons = Array.from(document.querySelectorAll('[data-save-draft]'));
  const clearDraftButton = document.querySelector('[data-clear-draft]');
  const pricingInput = educatorForm.querySelector('[name="listing[pricing]"]');
  const pricingValue = document.querySelector('[data-pricing-value]');
  const subjectList = educatorForm.querySelector('[data-subjects-list]');
  const subjectTemplate = educatorForm.querySelector('#subject-row-template');
  const addSubjectButton = educatorForm.querySelector('[data-add-subject]');
  const typeError = educatorForm.querySelector('[data-type-error]');
  const availabilityDayInputs = Array.from(educatorForm.querySelectorAll('input[name="listing[availability][days][]"]'));
  const availabilityDaysError = educatorForm.querySelector('[data-availability-days-error]');
  const educatorTypeInputs = Array.from(educatorForm.querySelectorAll('input[name="listing[educatorType]"]'));
  const studentSection = educatorForm.querySelector('[data-educator-section="student"]');
  const professionalSection = educatorForm.querySelector('[data-educator-section="professional"]');
  const conditionalInputs = Array.from(educatorForm.querySelectorAll('[data-conditional-input]'));
  const imageFileInputs = Array.from(educatorForm.querySelectorAll('input[type="file"][name="listing[image]"], input[type="file"][name="listing[governmentId]"]'));
  const storageAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  let currentStep = 0;
  const allowedImageMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png']);
  const imageTypeErrorMessage = 'Only image files (JPG, JPEG, PNG) are allowed.';

  const pricingLabels = new Map([
    ['50', '₹50/hr'],
    ['100', '₹100/hr'],
    ['150', '₹150/hr'],
    ['200', '₹200/hr'],
    ['300', '₹300/hr'],
    ['500', '₹500/hr'],
    ['750', '₹750/hr'],
    ['1000', '₹1000/hr'],
  ]);

  function syncPricingValue() {
    if (!pricingInput || !pricingValue) {
      return;
    }

    pricingValue.textContent = pricingLabels.get(pricingInput.value) || `₹${pricingInput.value}/hr`;
  }

  function saveDraft() {
    if (!storageAvailable) {
      return;
    }

    const payload = new FormData(educatorForm);
    const draft = {};

    for (const [key, value] of payload.entries()) {
      if (value instanceof File && value.size > 0) {
        continue;
      }

      if (draft[key] !== undefined) {
        if (Array.isArray(draft[key])) {
          draft[key].push(value);
        } else {
          draft[key] = [draft[key], value];
        }
      } else {
        draft[key] = value;
      }
    }

    localStorage.setItem(draftKey, JSON.stringify(draft));
  }

  function clearDraft() {
    if (storageAvailable) {
      localStorage.removeItem(draftKey);
    }
  }

  function fillRadioGroup(name, value) {
    const selector = `[name="${CSS.escape(name)}"][value="${CSS.escape(String(value))}"]`;
    const radio = educatorForm.querySelector(selector);

    if (radio) {
      radio.checked = true;
    }
  }

  function fillCheckboxGroup(name, values) {
    const selectedValues = new Set(Array.isArray(values) ? values.map(String) : [String(values)]);
    Array.from(educatorForm.querySelectorAll(`[name="${CSS.escape(name)}"]`)).forEach((checkbox) => {
      checkbox.checked = selectedValues.has(checkbox.value);
    });
  }

  function fillField(name, value) {
    if (name === 'listing[governmentId]') {
      return;
    }

    const fields = Array.from(educatorForm.querySelectorAll(`[name="${CSS.escape(name)}"]`));

    if (fields.length === 0) {
      return;
    }

    const firstField = fields[0];

    if (firstField.type === 'radio') {
      fillRadioGroup(name, value);
      return;
    }

    if (firstField.type === 'checkbox' && name.endsWith('[]')) {
      fillCheckboxGroup(name, value);
      return;
    }

    if (firstField.type === 'checkbox') {
      firstField.checked = value === true || value === 'true' || value === 'on';
      return;
    }

    firstField.value = value;
  }

  function buildSubjectRow(index, preset = {}) {
    const html = subjectTemplate.innerHTML.replaceAll('__INDEX__', String(index));
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const row = wrapper.firstElementChild;

    const nameInput = row.querySelector('[data-subject-name]');
    const levelSelect = row.querySelector('[data-subject-level]');

    if (preset.name) {
      nameInput.value = preset.name;
    }

    if (preset.level) {
      levelSelect.value = preset.level;
    }

    row.querySelector('[data-remove-subject]').addEventListener('click', () => {
      if (subjectList.children.length === 1) {
        nameInput.value = '';
        levelSelect.value = '';
        saveDraft();
        return;
      }

      row.remove();
      renumberSubjects();
      saveDraft();
    });

    return row;
  }

  function renumberSubjects() {
    Array.from(subjectList.querySelectorAll('[data-subject-row]')).forEach((row, index) => {
      row.querySelector('[data-subject-name]').name = `listing[subjects][${index}][name]`;
      row.querySelector('[data-subject-level]').name = `listing[subjects][${index}][level]`;
    });
  }

  function ensureSubjectRows(count = 1) {
    while (subjectList.children.length < count) {
      subjectList.appendChild(buildSubjectRow(subjectList.children.length));
    }

    if (subjectList.children.length === 0) {
      subjectList.appendChild(buildSubjectRow(0));
    }

    renumberSubjects();
  }

  function restoreDraft() {
    if (!storageAvailable) {
      ensureSubjectRows();
      return;
    }

    const saved = localStorage.getItem(draftKey);
    if (!saved) {
      ensureSubjectRows();
      return;
    }

    try {
      const draft = JSON.parse(saved);
      const subjectIndices = new Set();
      let maxSubjectIndex = -1;

      Object.entries(draft).forEach(([name, value]) => {
        const subjectMatch = name.match(/^listing\[subjects\]\[(\d+)\]\[/);
        if (subjectMatch) {
          const subjectIndex = Number(subjectMatch[1]);
          subjectIndices.add(subjectIndex);
          maxSubjectIndex = Math.max(maxSubjectIndex, subjectIndex);
        }

        if (Array.isArray(value) && name.endsWith('[]')) {
          fillField(name, value);
          return;
        }

        fillField(name, value);
      });

      ensureSubjectRows(Math.max(maxSubjectIndex + 1, 1));

      Object.entries(draft).forEach(([name, value]) => {
        if (name.match(/^listing\[subjects\]\[(\d+)\]\[/)) {
          fillField(name, value);
        }
      });
    } catch (error) {
      clearDraft();
      ensureSubjectRows();
    }
  }

  function updateConditionalSections() {
    const selectedType = educatorTypeInputs.find((input) => input.checked)?.value || '';
    const showStudent = selectedType === 'Student';
    const showProfessional = selectedType === 'Professional';

    studentSection.hidden = !showStudent;
    professionalSection.hidden = !showProfessional;

    conditionalInputs.forEach((input) => {
      const belongsToStudent = studentSection.contains(input);
      const belongsToProfessional = professionalSection.contains(input);
      const shouldEnable = (showStudent && belongsToStudent) || (showProfessional && belongsToProfessional);

      input.disabled = !shouldEnable;
      input.required = shouldEnable;
    });

    if (typeError) {
      typeError.hidden = selectedType !== '';
    }
  }

  function updateStepUI() {
    steps.forEach((step, index) => {
      const isActive = index === currentStep;
      step.hidden = !isActive;
      step.classList.toggle('is-active', isActive);
    });

    stepPills.forEach((pill, index) => {
      pill.classList.toggle('is-active', index === currentStep);
      pill.classList.toggle('is-complete', index < currentStep);
    });

    if (progressBar) {
      progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    }

    if (stepCaption) {
      stepCaption.textContent = `Step ${currentStep + 1} of ${steps.length}`;
    }

    prevButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;

    updateConditionalSections();
    syncPricingValue();
  }

  function currentStepIsValid() {
    const activeStep = steps[currentStep];
    const fields = Array.from(activeStep.querySelectorAll('input, textarea, select'));

    return fields.every((field) => {
      if (field.disabled || field.type === 'hidden') {
        return true;
      }

      if (field.type === 'radio') {
        if (!field.required) {
          return true;
        }

        const group = educatorForm.querySelectorAll(`[name="${CSS.escape(field.name)}"]`);
        return Array.from(group).some((input) => input.checked);
      }

      if (field.type === 'checkbox') {
        if (!field.required) {
          return true;
        }

        const group = educatorForm.querySelectorAll(`[name="${CSS.escape(field.name)}"]`);
        return Array.from(group).some((input) => input.checked);
      }

      return field.checkValidity();
    });
  }

  function validateImageFileInput(input) {
    const selectedFile = input.files && input.files[0];

    if (!selectedFile) {
      input.setCustomValidity('');
      return true;
    }

    const mimeType = (selectedFile.type || '').toLowerCase();
    if (allowedImageMimeTypes.has(mimeType)) {
      input.setCustomValidity('');
      return true;
    }

    input.setCustomValidity(imageTypeErrorMessage);
    return false;
  }

  function validateAvailabilityDays() {
    if (!availabilityDayInputs.length) {
      return true;
    }

    const hasSelection = availabilityDayInputs.some((input) => input.checked);
    const firstInput = availabilityDayInputs[0];

    if (hasSelection) {
      firstInput.setCustomValidity('');
      if (availabilityDaysError) {
        availabilityDaysError.hidden = true;
      }
      return true;
    }

    firstInput.setCustomValidity('Please select at least one available day.');
    if (availabilityDaysError) {
      availabilityDaysError.hidden = false;
    }
    return false;
  }

  function focusFirstInput() {
    const activeStep = steps[currentStep];
    const firstField = activeStep.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])');

    if (firstField) {
      firstField.focus({ preventScroll: false });
    }
  }

  educatorTypeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateConditionalSections();
      saveDraft();
    });
  });

  if (addSubjectButton) {
    addSubjectButton.addEventListener('click', () => {
      subjectList.appendChild(buildSubjectRow(subjectList.children.length));
      renumberSubjects();
      saveDraft();
    });
  }

  if (pricingInput) {
    pricingInput.addEventListener('input', syncPricingValue);
    pricingInput.addEventListener('change', saveDraft);
  }

  availabilityDayInputs.forEach((input) => {
    input.addEventListener('change', () => {
      validateAvailabilityDays();
      saveDraft();
    });
  });

  imageFileInputs.forEach((input) => {
    input.addEventListener('change', () => {
      validateImageFileInput(input);
      saveDraft();
    });
  });

  saveDraftButtons.forEach((button) => {
    button.addEventListener('click', () => {
      saveDraft();
      const originalLabel = button.textContent;
      button.textContent = 'Draft saved';

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1400);
    });
  });

  if (clearDraftButton) {
    clearDraftButton.addEventListener('click', () => {
      clearDraft();
      window.location.reload();
    });
  }

  educatorForm.addEventListener('input', () => {
    saveDraft();
  });

  nextButton.addEventListener('click', () => {
    if (!currentStepIsValid()) {
      educatorForm.classList.add('was-validated');
      educatorForm.reportValidity();
      return;
    }

    currentStep = Math.min(currentStep + 1, steps.length - 1);
    updateStepUI();
    focusFirstInput();
  });

  prevButton.addEventListener('click', () => {
    currentStep = Math.max(currentStep - 1, 0);
    updateStepUI();
    focusFirstInput();
  });

  educatorForm.addEventListener('submit', (event) => {
    updateConditionalSections();
    ensureSubjectRows();

    const validImageInputs = imageFileInputs.every((input) => validateImageFileInput(input));

    if (!validImageInputs) {
      event.preventDefault();
      event.stopPropagation();
      educatorForm.classList.add('was-validated');
      educatorForm.reportValidity();
      return;
    }

    const validAvailabilityDays = validateAvailabilityDays();
    if (!validAvailabilityDays) {
      event.preventDefault();
      event.stopPropagation();
      educatorForm.classList.add('was-validated');
      educatorForm.reportValidity();
      return;
    }

    if (!educatorForm.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      educatorForm.classList.add('was-validated');
      return;
    }

    clearDraft();
  });

  restoreDraft();
  updateConditionalSections();
  updateStepUI();
  syncPricingValue();
})();
