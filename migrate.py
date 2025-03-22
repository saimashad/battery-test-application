import argparse
import alembic.config

def run_migrations(args):
    # Prepare arguments for Alembic
    alembic_args = [
        "--raiseerr",  # Raise errors instead of exiting
        args.command,  # upgrade, downgrade, etc.
    ]
    
    # Add revision or 'head' for upgrades/downgrades
    if args.command in ["upgrade", "downgrade"]:
        alembic_args.append(args.revision or "head")
    
    # Run Alembic command
    alembic.config.main(argv=alembic_args)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run database migrations")
    parser.add_argument(
        "command", 
        choices=["upgrade", "downgrade", "current", "history", "revision"],
        help="Alembic command to run"
    )
    parser.add_argument(
        "--revision", 
        help="Revision target (default: 'head' for upgrade/downgrade)"
    )
    
    args = parser.parse_args()
    run_migrations(args)