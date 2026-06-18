export enum CompletenessStatus {
  COMPLETE = 'COMPLETE',
  INCOMPLETE_EVIDENCE = 'INCOMPLETE_EVIDENCE',
}

export interface SourceReference {
  referenceId: string;
  documentTitle: string;
  sectionIdentifier: string;
  pageOrLocation?: string;
}

export interface MappingDecisionReviewDTO {
  mappingId: string;
  sourceDocumentId: string;
  targetRequirementId: string;
  confidenceScore: number;
  sourceReferences: SourceReference[];
  sourceExcerpt: string;
  completenessStatus: CompletenessStatus;
  incompleteReasons: string[];
}

export interface FieldContractViolation {
  field: string;
  rule: string;
}

export function validateFieldContracts(dto: MappingDecisionReviewDTO): FieldContractViolation[] {
  const violations: FieldContractViolation[] = [];

  // mappingId
  if (!dto.mappingId || dto.mappingId.trim().length === 0) {
    violations.push({ field: 'mappingId', rule: 'must be non-null and non-empty' });
  }

  // sourceDocumentId
  if (!dto.sourceDocumentId || dto.sourceDocumentId.length === 0) {
    violations.push({ field: 'sourceDocumentId', rule: 'must be non-null and non-empty' });
  }

  // targetRequirementId
  if (!dto.targetRequirementId || dto.targetRequirementId.length === 0) {
    violations.push({ field: 'targetRequirementId', rule: 'must be non-null and non-empty' });
  }

  // confidenceScore
  if (dto.confidenceScore == null) {
    violations.push({ field: 'confidenceScore', rule: 'must be a finite number' });
  } else if (!isFinite(dto.confidenceScore) || isNaN(dto.confidenceScore)) {
    violations.push({ field: 'confidenceScore', rule: 'must be a finite number' });
  } else if (dto.confidenceScore < 0.0 || dto.confidenceScore > 1.0) {
    violations.push({ field: 'confidenceScore', rule: 'must be in range [0.00, 1.00]' });
  }

  // sourceReferences
  if (!dto.sourceReferences || dto.sourceReferences.length < 1) {
    violations.push({ field: 'sourceReferences', rule: 'must contain at least one element' });
  } else {
    dto.sourceReferences.forEach((ref, idx) => {
      if (!ref.referenceId || ref.referenceId.trim().length === 0) {
        violations.push({ field: `sourceReferences[${idx}].referenceId`, rule: 'must be non-empty' });
      }
      if (!ref.documentTitle || ref.documentTitle.trim().length === 0) {
        violations.push({ field: `sourceReferences[${idx}].documentTitle`, rule: 'must be non-empty' });
      }
      if (!ref.sectionIdentifier || ref.sectionIdentifier.trim().length === 0) {
        violations.push({ field: `sourceReferences[${idx}].sectionIdentifier`, rule: 'must be non-empty' });
      }
    });
  }

  // sourceExcerpt
  if (!dto.sourceExcerpt || dto.sourceExcerpt.trim().length === 0) {
    violations.push({ field: 'sourceExcerpt', rule: 'must be non-null, non-empty, and non-whitespace-only' });
  }

  // completenessStatus
  const validStatuses = Object.values(CompletenessStatus) as string[];
  if (!validStatuses.includes(dto.completenessStatus as string)) {
    violations.push({ field: 'completenessStatus', rule: 'must be COMPLETE or INCOMPLETE_EVIDENCE' });
  }

  // incompleteReasons conditionality
  if (dto.completenessStatus === CompletenessStatus.COMPLETE) {
    if (dto.incompleteReasons && dto.incompleteReasons.length > 0) {
      violations.push({ field: 'incompleteReasons', rule: 'must be empty array when completenessStatus is COMPLETE' });
    }
  } else if (dto.completenessStatus === CompletenessStatus.INCOMPLETE_EVIDENCE) {
    if (dto.incompleteReasons == null) {
      violations.push({ field: 'incompleteReasons', rule: 'must be non-null when completenessStatus is INCOMPLETE_EVIDENCE' });
    }
  }

  return violations;
}
