"""Management command: generate RSA key pair for federation."""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Generate an RSA-2048 key pair for federation signing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--save",
            action="store_true",
            help="Save public key to the home Instance record in the database.",
        )

    def handle(self, *args, **kwargs):
        try:
            from federation.crypto import generate_keypair
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"cryptography package required: {exc}"))
            return

        self.stdout.write("Generating RSA-2048 key pair...")
        private_pem, public_pem = generate_keypair()

        self.stdout.write(self.style.SUCCESS("\n=== PRIVATE KEY (keep secret!) ==="))
        self.stdout.write(private_pem)
        self.stdout.write(self.style.SUCCESS("\n=== PUBLIC KEY ==="))
        self.stdout.write(public_pem)

        self.stdout.write(self.style.WARNING(
            "\nAdd to your .env:\n"
            f"INSTANCE_PRIVATE_KEY='{private_pem.strip()}'\n"
        ))

        if kwargs["save"]:
            from federation.models import Instance
            from django.utils import timezone
            home, created = Instance.objects.get_or_create(
                is_home=True,
                defaults={"domain": "localhost", "name": "Home Instance"},
            )
            home.public_key = public_pem
            home.keypair_created_at = timezone.now()
            home.save(update_fields=["public_key", "keypair_created_at"])
            self.stdout.write(self.style.SUCCESS("Public key saved to home instance."))
