/**
 * Terraform automation routes — /api/terraform (all require authentication).
 *
 *  POST /init       run terraform init        (DevOps Engineer and above)
 *  POST /validate   run terraform validate    (DevOps Engineer and above)
 *  POST /plan       run terraform plan         (DevOps Engineer and above)
 *  POST /apply      run terraform apply        (Cloud Engineer and above)
 *  POST /destroy    run terraform destroy      (Cloud Engineer and above)
 *  GET  /history    terraform deployment history (any authenticated role)
 *
 * Mutating actions (apply/destroy) are also guarded by env flags in the service
 * (TERRAFORM_ENABLED + TERRAFORM_ALLOW_MUTATIONS).
 */
import { Router } from 'express';
import terraformController from '../controllers/terraform.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeMin } from '../middleware/rbac.js';
import validate from '../middleware/validate.js';
import { runValidation, historyValidation } from '../validations/terraform.validation.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

const canRun = authorizeMin(ROLES.DEVOPS_ENGINEER);
const canMutate = authorizeMin(ROLES.CLOUD_ENGINEER);

router.post('/init', canRun, validate(runValidation), terraformController.init);
router.post('/validate', canRun, validate(runValidation), terraformController.validate);
router.post('/plan', canRun, validate(runValidation), terraformController.plan);
router.post('/apply', canMutate, validate(runValidation), terraformController.apply);
router.post('/destroy', canMutate, validate(runValidation), terraformController.destroy);

router.get('/history', validate(historyValidation), terraformController.history);

export default router;
