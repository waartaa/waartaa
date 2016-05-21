import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.md')) as f:
    README = f.read()

with open(os.path.join(here, 'CHANGELOG.md')) as f:
    CHANGES = f.read()


def parse_requirements(requirements_file):
    with open(requirements_file, 'r') as f:
        return [line for line in f if line.strip() and not line.startswith('#')]

REQUIREMENTS_PATH = 'requirements.txt'

setup(
    name='waartaa',
    version='0.1.1',
    description='waartaa',
    long_description=README + '\n\n' + CHANGES,
    classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
    ],
    author='',
    author_email='',
    url='',
    keywords='web pyramid pylons',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=parse_requirements(REQUIREMENTS_PATH),
    tests_require=parse_requirements(REQUIREMENTS_PATH),
    test_suite="waartaa",
    entry_points={
        'paste.app_factory': [
            "main = waartaa:main"
        ]
    }
)
