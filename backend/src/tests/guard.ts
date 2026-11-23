const REF = process.env.SUPABASE_REF;

for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const value = process.env[name];
  if (!value) continue;

  if (REF && value.includes(REF)) {
    throw new Error(
      name + " points at the production project, refusing to run tests",
    );
  }

  // the local test database and the GitHub Actions container are both named applythis_test
  if (!value.includes("applythis_test")) {
    // abort, which probly mean we reading from .env (that contain real db url)
    throw new Error(
      name +
        " must point at the applythis_test database, refusing to run tests",
    );
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set for the tests");
}
