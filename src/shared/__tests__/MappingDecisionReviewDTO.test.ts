import {
  CompletenessStatus,
  validateFieldContracts,
} from '../MappingDecisionReviewDTO';
import type { MappingDecisionReviewDTO, SourceReference } from '../MappingDecisionReviewDTO';

function buildValidRef(overrides: Partial<SourceReference> = {}): SourceReference {
  return {
    referenceId: 'ref-001',
    documentTitle: 'DHF Design Specification v2.1',
    sectionIdentifier: '§3.4.2',
    pageOrLocation: 'p. 18',
    ...overrides,
  };
}

function buildValidDTO(overrides: Partial<MappingDecisionReviewDTO> = {}): MappingDecisionReviewDTO {
  return {
    mappingId: '550e8400-e29b-41d4-a716-446655440000',
    sourceDocumentId: 'doc-001',
    targetRequirementId: 'req-042',
    confidenceScore: 0.87,
    sourceReferences: [buildValidRef()],
    sourceExcerpt: 'The device shall maintain a core temperature within specified limits.',
    completenessStatus: CompletenessStatus.COMPLETE,
    incompleteReasons: [],
    ...overrides,
  };
}

describe('valid DTO', () => {
  it('returns no violations for a fully valid COMPLETE DTO', () => {
    expect(validateFieldContracts(buildValidDTO())).toHaveLength(0);
  });

  it('returns no violations for a valid INCOMPLETE_EVIDENCE DTO with incompleteReasons populated', () => {
    const dto = buildValidDTO({
      completenessStatus: CompletenessStatus.INCOMPLETE_EVIDENCE,
      incompleteReasons: ['MISSING_CONFIDENCE_SCORE'],
    });
    expect(validateFieldContracts(dto)).toHaveLength(0);
  });
});

describe('confidenceScore', () => {
  it('accepts boundary value 0.00', () => {
    expect(validateFieldContracts(buildValidDTO({ confidenceScore: 0.00 }))).toHaveLength(0);
  });

  it('accepts boundary value 1.00', () => {
    expect(validateFieldContracts(buildValidDTO({ confidenceScore: 1.00 }))).toHaveLength(0);
  });

  it('accepts mid-range value 0.87', () => {
    expect(validateFieldContracts(buildValidDTO({ confidenceScore: 0.87 }))).toHaveLength(0);
  });

  it('rejects score below 0.00 (-0.01)', () => {
    const violations = validateFieldContracts(buildValidDTO({ confidenceScore: -0.01 }));
    expect(violations.some(v => v.field === 'confidenceScore' && v.rule.includes('range'))).toBe(true);
  });

  it('rejects score above 1.00 (1.01)', () => {
    const violations = validateFieldContracts(buildValidDTO({ confidenceScore: 1.01 }));
    expect(violations.some(v => v.field === 'confidenceScore' && v.rule.includes('range'))).toBe(true);
  });

  it('rejects NaN', () => {
    const violations = validateFieldContracts(buildValidDTO({ confidenceScore: Number.NaN }));
    expect(violations.some(v => v.field === 'confidenceScore' && v.rule.includes('finite'))).toBe(true);
  });

  it('rejects Infinity', () => {
    const violations = validateFieldContracts(buildValidDTO({ confidenceScore: Infinity }));
    expect(violations.some(v => v.field === 'confidenceScore' && v.rule.includes('finite'))).toBe(true);
  });

  it('rejects -Infinity', () => {
    const violations = validateFieldContracts(buildValidDTO({ confidenceScore: -Infinity }));
    expect(violations.some(v => v.field === 'confidenceScore' && v.rule.includes('finite'))).toBe(true);
  });
});

describe('sourceReferences', () => {
  it('accepts a single-element array', () => {
    expect(validateFieldContracts(buildValidDTO({ sourceReferences: [buildValidRef()] }))).toHaveLength(0);
  });

  it('accepts a multi-element array', () => {
    expect(validateFieldContracts(buildValidDTO({ sourceReferences: [buildValidRef(), buildValidRef({ referenceId: 'ref-002' })] }))).toHaveLength(0);
  });

  it('rejects an empty array', () => {
    const violations = validateFieldContracts(buildValidDTO({ sourceReferences: [] }));
    expect(violations.some(v => v.field === 'sourceReferences' && v.rule.includes('at least one'))).toBe(true);
  });

  it('rejects a reference with empty referenceId', () => {
    const violations = validateFieldContracts(buildValidDTO({ sourceReferences: [buildValidRef({ referenceId: '' })] }));
    expect(violations.some(v => v.field === 'sourceReferences[0].referenceId')).toBe(true);
  });

  it('rejects a reference with whitespace-only documentTitle', () => {
    const violations = validateFieldContracts(buildValidDTO({ sourceReferences: [buildValidRef({ documentTitle: '   ' })] }));
    expect(violations.some(v => v.field === 'sourceReferences[0].documentTitle')).toBe(true);
  });

  it('rejects a reference with empty sectionIdentifier', () => {
    const violations = validateFieldContracts(buildValidDTO({ sourceReferences: [buildValidRef({ sectionIdentifier: '' })] }));
    expect(violations.some(v => v.field === 'sourceReferences[0].sectionIdentifier')).toBe(true);
  });

  it('accepts a reference with pageOrLocation absent (optional)', () => {
    const ref = buildValidRef();
    delete ref.pageOrLocation;
    expect(validateFieldContracts(buildValidDTO({ sourceReferences: [ref] }))).toHaveLength(0);
  });

  it('accepts a reference with pageOrLocation present', () => {
    expect(validateFieldContracts(buildValidDTO({ sourceReferences: [buildValidRef({ pageOrLocation: 'p. 18' })] }))).toHaveLength(0);
  });
});

describe('sourceExcerpt', () => {
  it('accepts a non-empty excerpt', () => {
    expect(validateFieldContracts(buildValidDTO({ sourceExcerpt: 'Valid excerpt text.' }))).toHaveLength(0);
  });

  it('rejects an empty string', () => {
    const violations = validateFieldContracts(buildValidDTO({ sourceExcerpt: '' }));
    expect(violations.some(v => v.field === 'sourceExcerpt')).toBe(true);
  });

  it('rejects a whitespace-only string', () => {
    const violations = validateFieldContracts(buildValidDTO({ sourceExcerpt: '   ' }));
    expect(violations.some(v => v.field === 'sourceExcerpt')).toBe(true);
  });
});

describe('completenessStatus enum', () => {
  it('accepts COMPLETE', () => {
    expect(validateFieldContracts(buildValidDTO({ completenessStatus: CompletenessStatus.COMPLETE }))).toHaveLength(0);
  });

  it('accepts INCOMPLETE_EVIDENCE', () => {
    const dto = buildValidDTO({
      completenessStatus: CompletenessStatus.INCOMPLETE_EVIDENCE,
      incompleteReasons: ['MISSING_SOURCE_EXCERPT'],
    });
    expect(validateFieldContracts(dto)).toHaveLength(0);
  });

  it('rejects an unlisted string value cast through unknown', () => {
    const dto = buildValidDTO({ completenessStatus: ('' as unknown as CompletenessStatus) });
    const violations = validateFieldContracts(dto);
    expect(violations.some(v => v.field === 'completenessStatus')).toBe(true);
  });
});

describe('incompleteReasons conditionality', () => {
  it('rejects non-empty incompleteReasons when status is COMPLETE', () => {
    const dto = buildValidDTO({
      completenessStatus: CompletenessStatus.COMPLETE,
      incompleteReasons: ['MISSING_SCORE'],
    });
    const violations = validateFieldContracts(dto);
    expect(violations.some(v => v.field === 'incompleteReasons' && v.rule.includes('empty array'))).toBe(true);
  });

  it('accepts empty incompleteReasons when status is COMPLETE', () => {
    expect(validateFieldContracts(buildValidDTO({ incompleteReasons: [] }))).toHaveLength(0);
  });

  it('accepts non-empty incompleteReasons when status is INCOMPLETE_EVIDENCE', () => {
    const dto = buildValidDTO({
      completenessStatus: CompletenessStatus.INCOMPLETE_EVIDENCE,
      incompleteReasons: ['MISSING_SOURCE_EXCERPT'],
    });
    expect(validateFieldContracts(dto)).toHaveLength(0);
  });

  it('accepts empty incompleteReasons when status is INCOMPLETE_EVIDENCE', () => {
    const dto = buildValidDTO({
      completenessStatus: CompletenessStatus.INCOMPLETE_EVIDENCE,
      incompleteReasons: [],
    });
    expect(validateFieldContracts(dto)).toHaveLength(0);
  });
});
