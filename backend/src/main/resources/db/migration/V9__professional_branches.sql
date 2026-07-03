CREATE TABLE professional_branches (
    professional_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    PRIMARY KEY (professional_id, branch_id),
    CONSTRAINT fk_prof_branches_professional FOREIGN KEY (professional_id) REFERENCES professionals (id) ON DELETE CASCADE,
    CONSTRAINT fk_prof_branches_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE
);

ALTER TABLE professionals DROP COLUMN email;
ALTER TABLE professionals DROP COLUMN role_label;
